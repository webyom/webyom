(function(modKey, modName, modId) {
	var _MARK_PREFIX = $$.config.get('MARK_PREFIX');
	var _TMPL = [
		'<div class="block"><div class="blockInner">',
			'<div id="articleList">',
			'</div>',
		'</div></div>'
	].join('');
	
	var _cssList = [];
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	
	$.Class.extend(Handler, $$.Handler);
	
	Handler.prototype._unload = function() {
		$.css.unload(_cssList);
		$.js.unload(this._reqInfo.modInfo.url);
		return Handler.superClass._unload.call(this);
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
		this._reqInfo = reqInfo;
		data = data || $.history.ajax.getCache(fullMark);
		if(data) {
			$.history.ajax.setMark(fullMark, reqInfo.modInfo.title + $$.config.get('TITLE_POSTFIX'));
			$('#mainPart').size() || $$.ui.resetContent();
			$('#mainPart').tween(1000, {
				origin: {
					style: 'left: 0px; opacity: 1; position: relative;'
				},
				target: {
					style: 'left: -300px; opacity: 0; position: relative;'
				},
				css: true,
				prior: true,
				transition: 'easeOut',
				complete: function() {
					$('#mainPart').setHtml($.tmpl.render(_TMPL, data, {key: 'mod.articleList'}));
					$$.util.prettyPrint();
					$('#mainPart').tween(1000, {
						origin: {
							style: 'left: -300px; opacity: 0; position: relative;'
						},
						target: {
							style: 'left: 0px; opacity: 1; position: relative;'
						},
						css: true,
						transition: 'easeOut'
					});
					setTimeout(function() {
						//$.js.preload($$_MOD_KEY_INFO_HASH['read'].url);
					}, 2000);
				}
			});
			return;
		}
		var url = '/data/' + mark;
		if($.Xhr.isUrlLoading(url)) {
			return;
		}
		/*
		new $.JsLoader(url, {
			callbackName: '_get_article_list',
			callback: function(o) {
				$('#mainPart').setHtml($.tmpl.render(_TMPL, data, {key: 'mod.articleList'}));
				$$.util.prettyPrint();
				$$.handler.setCache(mark, o.data);
			},
			error: function(code) {
				$$.handler.error(new $.Error(code, 'Failed to load article list ' + mark), modName);
			}, 
			complete: function() {
			}
		}).load();
		*/
		$$.util.xhr.get(url, {
			gid: this._id,
			callbackName: '_get_article_list',
			load: function(o) {
				$.history.ajax.setCache(fullMark, o.data);
				self.handle(mark, fullMark, reqInfo, data)
			},
			error: function(code) {
				self.error(new $.Error(code, 'Failed to load article list ' + mark), modName);
			}, 
			complete: function() {
			}
		});
		$$.ui.turnOnMenu('a');
	};
	
	new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, modName, $$.mod['ROOT'], {
		modKeyInfoHash: {
			
		},
		defaultModkey: 'profile'
	});
})('list', 'ARTICLE_LIST', 300);
