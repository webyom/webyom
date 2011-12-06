(function(modKey, modName, modId) {
	var _TMPL = [
		'<div class="block"><div class="blockInner">',
			'<div class="article">',
				'<h3><%=article.title%></h3>',
				'<p class="credit">',
					'by <a class="author" href="javascript:void(0);"><%=article.author%></a> at <%=article.creation_datetime%> <a class="comments comments<%=article.comments%>" href="#anchor_comments"><span id="commentsAmount1"><%=article.comments%></span> Comments</a>',
					'<%if(is_admin) {%>',
						'<a href="/view/write/<%=article.key_name%>">[Edit]</a>',
					'<%}%>',
				'</p>',
				'<%=article.content%>',
				'<%if(article.last_update_datetime) {%>',
					'<p class="updateLog">Last updated by <%=article.last_updater%> on <%=article.last_update_datetime%></p>',
				'<%}%>',
			'</div>',
		'</div></div>',
		'<div id="commentForm" class="block commnetBox"><div class="blockInner">',
			'<h2>Leave Your Comment</h2>',
			'<div class="body">',
				'<label for="username">Your Name:</label> <span class="required">*</span><input type="text" id="username" name="username" />',
				'<label for="website">Website:</label> <input type="text" id="website" name="website" value="http://" />',
				'<label for="email">Email:</label> <input type="text" id="email" name="email" />',
			'</div>',
			'<textarea name="msgpost" id="msgpost" cols="50" rows="10"></textarea>',
			'<div class="footer buttonGroup">',
				'<button id="btnSubmit" type="button" class="size1 size1hl">Submit</button> ',
				'<button id="btnReset" type="button" class="size1">Reset</button>',
			'</div>',
		'</div></div>',
		'<div id="anchor_comments">',
			'<div id="comments" class="block"><div class="blockInner">',
				'<h2>Comments (<span id="commentsAmount2"><%=article.comments%></span>)</h2>',
				'<%for(var i = 0, l = comments.length; i < l; i++) {',
					'var comment = comments[i]; if(!comment) {continue;}%>',
				'<div class="comment">',
					'<p class="credit">',
						'by ',
						'<%if(comment.website && comment.website != "http://") {%>',
							'<a class="author" href="<%=comment.website%>" target="_blank"><%=comment.author%></a>',
						'<%} else {%>',
							'<%=comment.author%>',
						'<%}%>',
						'<%if(comment.email) {%>',
							'(<%=comment.email%>)',
						'<%}%>',
						' at <%=comment.creation_datetime%>',
						'<%if(is_admin) {%>',
							'<a href="javascript:void(0);" onclick="$$.mod[\'' + modName + '\'].delComment(\'<%=comment.key_name%>\', \'<%=article.key_name%>\');">[Delete]</a>',
						'<%}%>',
					'</p>',
					'<%=comment.content%>',
				'</div>',
				'<%}%>',
			'</div></div>',
		'</div>',
		'<a id="commentsEnd"></a>'
	].join('');
	
	function _bindEvent(aid) {
		$('#btnSubmit').addEventListener('click', function() {
			var username = $.string.trim($('#username').getVal());
			var comment = $.string.trim($('#msgpost').getVal());
			if(!username || !comment) {
				alert('Please enter your name and comment.');
				return;
			}
			var param = $('#commentForm').toQueryString();
			$.js.require('/static/inc/webyom-js/local_storage.js', function() {
				var commentFormData = param.split('&');
				commentFormData.pop();
				$.localStorage.set('comment_form_data', commentFormData.join('&'), {proxy: 1});
			});
			$$.util.xhr.post('/data/comment/' + aid, {
				param: param,
				load: function(o) {
					if(o.ret === 0) {
						$$.handler.clearCache();
						handle(aid);
					} else {
						alert('Failed to post comment.');
					}
				},
				error: function() {
					alert('Failed to post comment.');
				},
				callbackName: '_post_res'
			});
		});
		$('#btnReset').addEventListener('click', function() {
			$('#msgpost').setVal('');
		});
	};
	
	function delComment(cid, aid) {
		if(!confirm('Confirm to delete this comment?')) {
			return;
		}
		$$.util.xhr.post('/data/del_comment', {
			param: {cid: cid},
			load: function(o) {
				if(o.ret === 0) {
					$$.handler.clearCache();
					handle(aid);
				} else {
					alert('Failed to delete comment.');
				}
			},
			error: function() {
				alert('Failed to delete comment.');
			},
			callbackName: '_post_res'
		});
	};
	
	function handle(subMark, data) {
		var cacheKey, params, aid;
		params = subMark.split('/');
		aid = params[0];
		if(!aid) {
			$$.handler.error(new $.Error(modId + '01', 'Invalid article id.'), modName);
			return;
		}
		cacheKey = modKey + '/' + aid;
		data = data || $$.handler.getCache(cacheKey);
		if(data) {
			$('#mainPart').size() || $$.ui.resetContent();
			$('#mainPart').tween(1000, {
				origin: {
					style: 'left: 0px; opacity: 1; position: relative;'
				},
				target: {
					style: 'left: -300px; opacity: 0; position: relative;'
				},
				transition: 'easeOut',
				complete: function() {
					$.tmpl.apply('#mainPart', _TMPL, data, {key: 'mod.readArticle'});
					$$.util.prettyPrint();
					if(params[1] == 'comment') {
						location.hash = 'anchor_comments';
					}
					$('#mainPart').tween(1000, {
						origin: {
							style: 'left: -300px; opacity: 0; position: relative;'
						},
						target: {
							style: 'left: 0px; opacity: 1; position: static;'
						},
						transition: 'easeOut'
					});
					_bindEvent(aid);
					$.js.require('/static/inc/webyom-js/local_storage.js', function() {
						$.localStorage.get('comment_form_data', {proxy: 1, callback: function(commentFormData) {
							if(commentFormData) {
								commentFormData = $.object.fromQueryString(commentFormData);
								$.object.each(commentFormData, function(val, key) {
									$('#' + key).setVal(val);
								});
							}
						}});
					});
				}
			});
			return;
		}
		$$.util.xhr.get('/data/' + modKey + '/' + aid, {
			callbackName: '_get_article_info',
			load: function(o) {
				$$.handler.setCache(cacheKey, o.data);
				handle(subMark, o.data);
			},
			error: function(code) {
				$$.handler.error(new $.Error(code, 'Failed to read article ' + aid), modName);
			}, 
			complete: function() {
			},
			noCache: true
		});
		$$.ui.turnOnMenu('a');
	};
	
	(function() {
		$.css.load('/static/inc/prettify/prettify.css');
		$.css.load('/static/css/form.css');
	})();
	
	$$.mod[modName] = {
		delComment: delComment,
		handle: handle
	};
})('read', 'READ_ARTICLE', 301);
