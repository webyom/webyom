define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg'], function(require, $, ajaxHistory, $$) {
	var modKey = 'list', 
		modName = 'ARTICLE_LIST', 
		modId = 300;
	
	var _tmpl = require('./article-list.tpl.html');
	
	var _cssList = ['/static/js/lib/prettify/prettify.css'];
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	
	$.Class.extend(Handler, $$.Handler);
	
	Handler.prototype._unload = function(parentUnloaded) {
		$.css.unload(_cssList);
		return Handler.superClass._unload.apply(this, $.array.getArray(arguments));
	};
	
	Handler.prototype.handle = function(mark, fullMark, reqInfo, data) {
		if(!this.isCurrentHandler()) {
			return;
		}
		$.css.load(_cssList);
		var self = this;
		if(!/^p\d+$/.test(mark)) {
			mark = 'p1';
		}
		data = data || ajaxHistory.getCache(fullMark);
		if(data) {
			ajaxHistory.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
			$$.ui.setMainContent(_tmpl(data));
			$$.ui.turnOnMenu('a');
			$$.util.prettyPrint();
			return;
		}
		var url = '/data/' + mark;
		if($.JsLoader.isUrlLoading(url)) {
			return;
		}
		///*
		new $.JsLoader(url, {
			callbackName: '_get_article_list',
			callback: function(o) {
				ajaxHistory.setCache(fullMark, o.data);
				self.handle(mark, fullMark, reqInfo)
			},
			error: function(code) {
				self.error(new $.Error(code, 'Failed to load article list ' + mark), modName);
			}, 
			complete: function() {
			}
		}).load();
		//*/
		/*
		$$.util.xhr.get(url, {
			gid: this._id,
			callbackName: '_get_article_list',
			load: function(o) {
				ajaxHistory.setCache(fullMark, o.data);
				self.handle(mark, fullMark, reqInfo)
			},
			error: function(code) {
				self.error(new $.Error(code, 'Failed to load article list ' + mark), modName);
			}, 
			complete: function() {
			}
		});
		*/
	};
	
	return new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, modKey, $$.Handler.mod.root);
});
