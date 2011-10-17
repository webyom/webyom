(function(modKey, modName, modId) {
	var _TMPL = [
		'<div class="block"><div class="blockInner">',
			'<div id="articleList">',
				'<%for(var i = 0, l = articles.length; i < l; i++) {',
					'var article = articles[i];',
					'if(!article) {continue;}%>',
					'<div class="article">',
						'<h3><a href="/view/read/<%=article.key_name%>"><%=article.title%></a><a href="/view/read/<%=article.key_name%>"  target="_blank"><img src="/static/img/blank.gif" class="iconNewWindow" alt="Open in new window." /></a></h3>',
						'<p class="credit">',
							'by <a class="author" href="javascript:void(0);"><%=article.author%></a> at <%=article.creation_datetime%> <a class="comments comments<%=article.comments%>" href="/view/read/<%=article.key_name%>/comment"><%=article.comments%> Comments</a>',
							'<%if(is_admin) {%>',
								'<a href="/view/write/<%=article.key_name%>">[Edit]</a>',
							'<%}%>',
						'</p>',
						'<%=article.content%>',
						'<%if(article.last_update_datetime != "None") {%>',
						'<p class="updateLog">Last updated by <%=article.last_updater%> at <%=article.last_update_datetime%></p>',
						'<%}%>',
					'</div>',
				'<%}%>',
				'<div>',
				'<%if(page !== 1) {%>',
					'<a id="artListPrevLink" href="javascript:void(0);" onclick="$$.handler.jump(\'' + modKey + '<%=page === 2 ? "" : "/p" + (page - 1)%>\');">&lt;Prev</a>',
				'<%}%>',
				'<%if(!is_last_page) {%>',
					'<a id="artListNextLink" href="javascript:void(0);" onclick="$$.handler.jump(\'' + modKey + '/p<%=page + 1%>\');">Next&gt;</a>',
				'<%}%>',
				'</div>',
			'</div>',
			'<br class="clearFix" />',
		'</div></div>'
	].join('');
	
	function handle(subMark, data) {
		var cacheKey;
		if(!/^p\d+$/.test(subMark)) {
			subMark = 'p1';
		}
		cacheKey = modKey + '/' + subMark;
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
					$.tmpl.apply('#mainPart', _TMPL, data, {key: 'mod.articleList'});
					$$.util.prettyPrint();
					$('#mainPart').tween(1000, {
						origin: {
							style: 'left: -300px; opacity: 0; position: relative;'
						},
						target: {
							style: 'left: 0px; opacity: 1; position: static;'
						},
						transition: 'easeOut'
					});
				}
			});
			return;
		}
		/*
		new $.JsLoader('/' + subMark, {
			callbackName: '_get_article_list',
			callback: function(o) {
				$.tmpl.apply('#mainPart', _TMPL, o.data, {key: 'mod.articleList'});
				$$.util.prettyPrint();
				$$.handler.setCache(mark, o.data);
			},
			error: function(code) {
				$$.handler.error(new $.Error(code, 'Failed to load article list ' + subMark), modName);
			}, 
			complete: function() {
			}
		}).load();
		*/
		$$.util.xhr.get('/data/' + subMark, {
			callbackName: '_get_article_list',
			load: function(o) {
				$$.handler.setCache(cacheKey, o.data);
				handle(subMark, o.data)
			},
			error: function(code) {
				$$.handler.error(new $.Error(code, 'Failed to load article list ' + subMark), modName);
			}, 
			complete: function() {
			}
		});
		$$.ui.turnOnMenu('a');
	};
	
	(function() {
		$.css.load('/static/inc/prettify/prettify.css');
	})();
	
	$$.mod[modName] = {
		handle: handle
	};
})('list', 'ARTICLE_LIST', 300);
