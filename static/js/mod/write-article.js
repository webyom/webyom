define('./write-article.html', [], function() {
	function $encodeHtml(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, '&#96;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
	};
	return function($data, $opt) {
		$data = $data || {};
		var _$out_= [];
		var $print = function(str) {_$out_.push(str);};
		with($data) {
		_$out_.push('<div id="writeArticle" class="sidePart"><div class="block yui-skin-sam"><div class="blockInner"><h2>Write Article</h2><div id="form"><p class="desc">You may use [html:code]Your code goes here[html:/code] to height-light a code segment.</p><table cellpadding="0" cellspacing="0"><tr><td><label for="category"><strong>Category: *</strong></label><br /><select id="category" name="category"><option></option><option value="HTML">HTML</option><option value="CSS">CSS</option><option value="Java">Java</option><option value="Javascript">Javascript</option><option value="PHP">PHP</option><option value="Python">Python</option><option value="Others">Others</option></select></td><td><label for="title"><strong>Title: *</strong></label><br /><input type="text" id="title" name="title" value="', title, '" /></td></tr><tr><td><label for="originalWriter">Original Writer: </label><br /><input type="text" id="originalWriter" name="originalWriter" /></td><td><label for="originalUrl">Original Url: </label><br /><input type="text" id="originalUrl" name="originalUrl" /></td></tr></table></div><textarea name="msgpost" id="msgpost" cols="50" rows="10">', content, '</textarea><div class="footer buttonGroup"><button id="btnSubmit" type="submit" class="size1 size1hl">Submit</button><button id="btnReset" type="button" class="size1">Reset</button></div></div></div></div>\'');
		}
		return _$out_.join('');
	};
});

define(['require', 'yom/core-pkg', 'yom/history', 'main-pkg', 'YUI#editor/editor-min', './write-article.html'], function(require, $, ajaxHistory, $$, Editor) {
	var modKey = 'write', 
		modName = 'WRITE_ARTICLE', 
		modId = 302;
	
	var _tmpl = require('./write-article.html');
	
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
