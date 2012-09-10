(function(modKey, modName, modId) {
	var _MARK_PREFIX = $$.config.get('MARK_PREFIX');
	var _TMPL = [
		'<div class="block"><div class="blockInner">',
			'<div class="article">',
				'<h3><%=article.title%></h3>',
				'<p class="credit">',
					'by <a class="author" href="javascript:void(0);"><%=article.author%></a> at <%=article.creation_datetime%> <a id="viewCommentsLink" class="comments comments<%=article.comments%>" href="javascript:void(0);"><span id="commentsAmount1"><%=article.comments%></span> Comments</a>',
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
		'<div data-mod-id="1" id="commentForm" class="block commnetBox sortable"><div class="handle"></div><div class="blockInner">',
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
		'<div data-mod-id="2" id="comments" class="block sortable"><div class="handle"></div><div class="blockInner">',
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
		'<a id="commentsEnd"></a>'
	].join('');
	
	var _cssList = ['/static/inc/prettify/prettify.css', '/static/css/form.css'];
	var _sortable = null;
	
	function _loadmodHook(e) {
		if(e.originMod.key == modKey && e.targetMod.key != modKey) {
			_sortable && _sortable.destory();
			_sortable = null;
			$.css.unload(_cssList);
			$$.handler.removeEventListener('loadmod', _loadmodHook);
		}
	};
	
	function _bindEvent(aid) {
		$('#btnSubmit').addEventListener('click', function() {
			var username = $.string.trim($('#username').getVal());
			var comment = $.string.trim($('#msgpost').getVal());
			if(!username || !comment) {
				$$alert('Please enter your name and comment.');
				return;
			}
			var param = $('#commentForm').toQueryString();
			$.js.require($$_LIB_NAME_URL_HASH.YOM_LOCAL_STORAGE, function() {
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
						$$alert('Failed to post comment.');
					}
				},
				error: function() {
					$$alert('Failed to post comment.');
				},
				callbackName: '_post_res'
			});
		});
		$('#btnReset').addEventListener('click', function() {
			$('#msgpost').setVal('');
		});
		$('#viewCommentsLink').addEventListener('click', _scrollToComments);
	};
	
	function _scrollToComments() {
		YOM(document.body).scrollTopTo(YOM('#comments'));
	};
	
	function _makeSortable() {
		$.js.require($$_LIB_NAME_URL_HASH.YOM_DRAGDROP, function(res) {
			_sortable && _sortable.destory();
			_sortable = new $.dragdrop.Sortable('#mainPart .sortable', {scrollContainer: document.body, cloneContainer: YOM('#mainPart'), handles: '.handle', enterDirection: 'V', boundary: 'PAGE', snap: 0, startOff: {left: 5, top: 5}, clone: 0});
			_sortable.addEventListener('sortrelease', function() {
				var tmp = [];
				$('#mainPart .sortable').each(function(el) {
					tmp.push(YOM(el).getDatasetVal('mod-id'));
				});
				$.js.require($$_LIB_NAME_URL_HASH.YOM_LOCAL_STORAGE, function(res) {
					$.localStorage.set('commentModSequence', tmp.join(' '), {proxy: 1});
				});
			});
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
					$$alert('Failed to delete comment.');
				}
			},
			error: function() {
				$$alert('Failed to delete comment.');
			},
			callbackName: '_post_res'
		});
	};
	
	function handle(modInfo, data) {
		$.css.load(_cssList);
		var cacheKey, params, aid;
		params = modInfo.subMark.split('/');
		aid = params[0];
		if(!aid) {
			$$.handler.error(new $.Error(modId + '01', 'Invalid article id.'), modName);
			return;
		}
		cacheKey = modKey + '/' + aid;
		data = data || $$.handler.getCache(cacheKey);
		if(data) {
			$$.handler.addEventListener('loadmod', _loadmodHook);
			$.history.ajax.setMark(modInfo.requestMark, data.article.title + ' - ' + modInfo.title + $$.config.get('TITLE_POSTFIX'));
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
					$('#mainPart').setHtml($.tmpl.render(_TMPL, data, {key: 'mod.readArticle'}));
					$.js.require($$_LIB_NAME_URL_HASH.YOM_LOCAL_STORAGE, function(res) {
						$.localStorage.get('commentModSequence', {proxy: 1, callback: function(res) {
							if(res) {
								$.object.each(res.split(' '), function(modId) {
									$('[data-mod-id="' + modId + '"]', '#mainPart').appendTo($('#mainPart'));
								});
							}
							if(params[1] == 'comment') {
								_scrollToComments();
							}
						}});
					});
					$$.util.prettyPrint();
					$('#mainPart').tween(1000, {
						origin: {
							style: 'left: -300px; opacity: 0; position: relative;'
						},
						target: {
							style: 'left: 0px; opacity: 1; position: relative;'
						},
						css: true,
						transition: 'easeOut',
						complete: _makeSortable
					});
					_bindEvent(aid);
					$.js.require($$_LIB_NAME_URL_HASH.YOM_LOCAL_STORAGE, function() {
						$.localStorage.get('comment_form_data', {proxy: 1, callback: function(commentFormData) {
							if(commentFormData) {
								commentFormData = $.object.fromQueryString(commentFormData);
								$.object.each(commentFormData, function(val, key) {
									$('#' + key).setVal(val);
								});
							}
						}});
					});
					setTimeout(function() {
						$.js.preload($$_MOD_KEY_INFO_HASH['list'].url);
					}, 2000);
				}
			});
			return;
		}
		$$.util.xhr.get('/data/' + modKey + '/' + aid, {
			callbackName: '_get_article_info',
			load: function(o) {
				$$.handler.setCache(cacheKey, o.data);
				handle(modInfo, o.data);
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
	
	$$.mod[modName] = {
		delComment: delComment,
		handle: handle
	};
})('read', 'READ_ARTICLE', 301);
