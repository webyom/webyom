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
		data = data || $.history.ajax.getCache(fullMark);
		if(data) {
			$.history.ajax.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
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
			$$.ui.turnOnMenu('a');
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
	};
	
	new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, modKey, $$.mod.root);
})('list', 'ARTICLE_LIST', 300);
