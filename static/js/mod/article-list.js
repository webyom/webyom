define('./article-list.tpl.html', [], function() {
	function $encodeHtml(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, '&#96;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
	};
	return function($data, $opt) {
		$data = $data || {};
		var _$out_= [];
		var $print = function(str) {_$out_.push(str);};
		with($data) {
		_$out_.push('<div class="block"><div class="blockInner"><div id="articleList">');
		for(var i = 0, l = articles.length; i < l; i++) {var article = articles[i];if(!article) {continue;}
		_$out_.push('<div class="article"><h3><a href="/view/read/', article.key_name, '">', article.title, '</a><a href="/view/read/', article.key_name, '"  target="_blank"><img src="/static/img/blank.gif" class="iconNewWindow" alt="Open in new window." /></a></h3><p class="credit">by <a class="author" href="javascript:void(0);">', article.author, '</a> at ', article.creation_datetime, ' <a class="comments comments', article.comments, '" href="/view/read/', article.key_name, '/comment">', article.comments, ' Comments</a>');
		if(is_admin) {
		_$out_.push('<a href="/view/write/', article.key_name, '">[Edit]</a>');
		}
		_$out_.push('</p>', article.content, '');
		if(article.last_update_datetime != "None") {
		_$out_.push('<p class="updateLog">Last updated by ', article.last_updater, ' at ', article.last_update_datetime, '</p>');
		}
		_$out_.push('</div>');
		}
		_$out_.push('<div>');
		if(page !== 1) {
		_$out_.push('<a id="artListPrevLink" href="/view/list', page === 2 ? "" : "/p" + (page - 1), '">&lt;Prev</a>');
		}
		_$out_.push('');
		if(!is_last_page) {
		_$out_.push('<a id="artListNextLink" href="/view/list/p', page + 1, '">Next&gt;</a>');
		}
		_$out_.push('</div></div><br class="clearFix" /></div></div>');
		}
		return _$out_.join('');
	};
});

define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg', './article-list.tpl.html'], function(require, $, ajaxHistory, $$) {
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
