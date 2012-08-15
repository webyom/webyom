(function(modKey, modName, modId) {
	var _MARK_PREFIX = $$.config.get('MARK_PREFIX');
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
					'<a id="artListPrevLink" href="/view/list<%=page === 2 ? "" : "/p" + (page - 1)%>">&lt;Prev</a>',
				'<%}%>',
				'<%if(!is_last_page) {%>',
					'<a id="artListNextLink" href="/view/list/p<%=page + 1%>">Next&gt;</a>',
				'<%}%>',
				'</div>',
			'</div>',
			'<br class="clearFix" />',
		'</div></div>'
	].join('');
	
	var _cssList = ['/static/inc/prettify/prettify.css'];
	
	function handle(subMark, data) {
		$.css.load(_cssList);
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
						$.js.preload($$_MOD_KEY_INFO_HASH['read'].url);
					}, 2000);
				}
			});
			return;
		}
		/*
		new $.JsLoader('/' + subMark, {
			callbackName: '_get_article_list',
			callback: function(o) {
				$('#mainPart').setHtml($.tmpl.render(_TMPL, data, {key: 'mod.articleList'}));
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
	
	$$.handler.addEventListener('loadmod', function(e) {
		if(e.originMod.key == modKey && e.targetMod.key != modKey) {
			$.css.unload(_cssList);
		}
	});
	
	$$.mod[modName] = {
		handle: handle
	};
})('list', 'ARTICLE_LIST', 300);
