define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg', 'YUI#editor/editor-min'], function(require, $, ajaxHistory, $$, Editor) {
	var modKey = 'write', 
		modName = 'WRITE_ARTICLE', 
		modId = 302;
	
	var _tmpl = require('./write-article.tpl.html');
	
	var _cssList = [
		'http://yui.yahooapis.com/2.7.0/build/assets/skins/sam/skin.css',
		'/static/css/yuiEditor.css',
		'/static/css/form.css'
	];
	
	function _render(url, data, aid) {
		$$.ui.setContent(_tmpl(data));
		$$.ui.turnOnMenu('a');
		var myEditor = new Editor('msgpost', {   
			height: '500px',   
			width: '100%',
			handleSubmit: true
		}); 
		myEditor.render();
		$('#btnSubmit').addEventListener('click', function() {
			myEditor.saveHTML();   
			var html = myEditor.get('element').value;
			if(!$.string.trim(html.replace(/<br>/ig, '').replace(/&nbsp;/ig, '')) || !$('#category').getVal() || !$('#title').getVal()) {
				$$alert('Please enter category, title, and content.');
				return;
			}
			$$.util.xhr.post(url, {
				param: $('#writeArticle').toQueryString(),
				load: function(o) {
					if(o.ret === 0) {
						ajaxHistory.clearCache();
						$$.Handler.mod.root.jump($$.config.get('MARK_PREFIX') + 'list');
					} else {
						$$alert('Failed to post article.');
					}
				},
				error: function() {
					$$alert('Failed to post article.');
				},
				callbackName: '_post_res'
			});
		});
		$('#btnReset').addEventListener('click', function() {
			myEditor.clearEditorDoc();
			$('#msgpost').setHtml('');
		});
	};
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	
	$.Class.extend(Handler, $$.Handler);
	
	Handler.prototype._unload = function(parentUnloaded) {
		$.css.unload(_cssList);
		return Handler.superClass._unload.apply(this, $.array.getArray(arguments));
	};
	
	Handler.prototype.handle = function(mark, fullMark, reqInfo) {
		if(!this.isCurrentHandler()) {
			return;
		}
		var self = this;
		$.css.load(_cssList);
		if(mark) {
			var url = '/data/update/' + mark;
			if($.Xhr.isUrlLoading(url)) {
				return;
			}
			$$.util.xhr.get(url, {
				gid: self._id,
				load: function(o) {
					if(o.ret === 0) {
						ajaxHistory.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
						_render('/data/update/' + mark, o.data.article, mark);
					} else {
						$$alert('Failed to get article1.');
					}
				},
				error: function() {
					$$alert('Failed to get article2.');
				},
				callbackName: '_get_article_info'
			});
		} else {
			ajaxHistory.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
			_render('/data/write', {title: '', content: ''});
		}
	};
	
	return new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, modKey, $$.Handler.mod.root);
});
