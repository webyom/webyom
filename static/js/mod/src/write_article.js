(function(modKey, modName, modId) {
	var _TMPL = [
		'<div id="writeArticle" class="sidePart"><div class="block yui-skin-sam"><div class="blockInner">',
			'<h2>Write Article</h2>',
			'<div id="form">',
				'<p class="desc">You may use [html:code]Your code goes here[html:/code] to height-light a code segment.</p>',
				'<table cellpadding="0" cellspacing="0">',
					'<tr>',
						'<td>',
							'<label for="category"><strong>Category: *</strong></label><br />',
							'<select id="category" name="category">',
								'<option></option>',
								'<option value="HTML">HTML</option>',
								'<option value="CSS">CSS</option>',
								'<option value="Java">Java</option>',
								'<option value="Javascript">Javascript</option>',
								'<option value="PHP">PHP</option>',
								'<option value="Python">Python</option>',
								'<option value="Others">Others</option>',
							'</select>',
						'</td>',
						'<td>',
							'<label for="title"><strong>Title: *</strong></label><br />',
							'<input type="text" id="title" name="title" value="<%=title%>" />',
						'</td>',
					'</tr>',
					'<tr>',
						'<td>',
							'<label for="originalWriter">Original Writer: </label><br />',
							'<input type="text" id="originalWriter" name="originalWriter" />',
						'</td>',
						'<td>',
							'<label for="originalUrl">Original Url: </label><br />',
							'<input type="text" id="originalUrl" name="originalUrl" />',
						'</td>',
					'</tr>',
				'</table>',
			'</div>',
			'<textarea name="msgpost" id="msgpost" cols="50" rows="10"><%=content%></textarea>',
			'<div class="footer buttonGroup">',
				'<button id="btnSubmit" type="submit" class="size1 size1hl">Submit</button>',
				'<button id="btnReset" type="button" class="size1">Reset</button>',
			'</div>',
		'</div></div></div>'
	].join('');
	
	function _render(url, data, aid) {
		$.tmpl.apply('#content', _TMPL, data, {key: 'mod.writeArticle'});
		var myEditor = new YAHOO.widget.Editor('msgpost', {   
			height: '500px',   
			width: '100%',
			handleSubmit: true
		}); 
		myEditor.render();
		$('#btnSubmit').addEventListener('click', function() {
			myEditor.saveHTML();   
			var html = myEditor.get('element').value;
			if(!$.string.trim(html.replace(/<br>/ig, '').replace(/&nbsp;/ig, '')) || !$('#category').getVal() || !$('#title').getVal()) {
				alert('Please enter category, title, and content.');
				return;
			}
			$$.util.xhr.post(url, {
				param: $('#writeArticle').toQueryString(),
				load: function(o) {
					if(o.ret === 0) {
						$$.handler.clearCache();
						$$.handler.jump('list');
					} else {
						alert('Failed to post article.');
					}
				},
				error: function() {
					alert('Failed to post article.');
				},
				callbackName: '_post_res'
			});
		});
		$('#btnReset').addEventListener('click', function() {
			myEditor.clearEditorDoc();
			$('#msgpost').setHtml('');
		});
		$$.ui.turnOnMenu('a');
	};
	
	function handle(subMark) {
		$.js.require([
			'http://yui.yahooapis.com/2.7.0/build/yahoo-dom-event/yahoo-dom-event.js',
			'http://yui.yahooapis.com/2.7.0/build/element/element-min.js',
			'http://yui.yahooapis.com/2.7.0/build/container/container_core-min.js',
			'http://yui.yahooapis.com/2.7.0/build/menu/menu-min.js',
			'http://yui.yahooapis.com/2.7.0/build/button/button-min.js',
			'http://yui.yahooapis.com/2.7.0/build/editor/editor-min.js'
		], function() {
			if(subMark) {
				$$.util.xhr.get('/data/update/' + subMark, {
					load: function(o) {
						if(o.ret === 0) {
							_render('/data/update/' + subMark, o.data.article, subMark);
						} else {
							alert('Failed to get article1.');
						}
					},
					error: function() {
						alert('Failed to get article2.');
					},
					callbackName: '_get_article_info'
				});
			} else {
				_render('/data/write', {title: '', content: ''});
			}
		})
	};
	
	(function() {
		$.css.load([
			'http://yui.yahooapis.com/2.7.0/build/assets/skins/sam/skin.css',
			'/static/css/yuiEditor.css',
			'/static/css/form.css'
		]);
	})();
	
	$$.mod[modName] = {
		handle: handle
	};
})('read', 'WRITE_ARTICLE', 302);