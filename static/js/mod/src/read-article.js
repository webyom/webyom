define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg'], function(require, $, ajaxHistory, $$) {
	var modKey = 'read', 
		modName = 'READ_ARTICLE', 
		modId = 301;
	
	var _tmpl = require('./read-article.tpl.html');
	
	var _cssList = ['/static/js/lib/prettify/prettify.css', '/static/css/form.css'];
	var _sortable = null;
	
	function _bindEvent(aid) {
		$('#btnSubmit').addEventListener('click', function() {
			var username = $.string.trim($('#username').getVal());
			var comment = $.string.trim($('#msgpost').getVal());
			if(!username || !comment) {
				$$alert('Please enter your name and comment.');
				return;
			}
			var param = $('#commentForm').toQueryString();
			var commentFormData = param.split('&');
			commentFormData.pop();
			$$.storage.set('comment_form_data', commentFormData.join('&'));
			$$.util.xhr.post('/data/comment/' + aid, {
				param: param,
				load: function(o) {
					if(o.ret === 0) {
						ajaxHistory.clearCache();
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
		$(document.body).scrollTopTo($('#comments'));
	};
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	
	$.Class.extend(Handler, $$.Handler);
	
	Handler.prototype._unload = function(parentUnloaded) {
		_sortable && _sortable.destory();
		_sortable = null;
		$.css.unload(_cssList);
		return Handler.superClass._unload.apply(this, $.array.getArray(arguments));
	};
	
	Handler.prototype._makeSortable = function() {
		var self = this;
		require(['yom/dragdrop/dragdrop-built'], function(dragdrop) {
			if(self._unloaded) {
				return
			}
			_sortable && _sortable.destory();
			_sortable = new dragdrop.Sortable('#mainPart .sortable', {scrollContainer: document.body, cloneContainer: $('#mainPart'), handles: '.handle', enterDirection: 'V', boundary: 'PAGE', snap: 0, startOff: {left: 5, top: 5}, clone: 0});
			_sortable.addEventListener('sortrelease', function() {
				var tmp = [];
				$('#mainPart .sortable').each(function(el) {
					tmp.push($(el).getDatasetVal('mod-id'));
				});
				$$.storage.set('commentModSequence', tmp.join(' '));
			});
		});
	};
	
	Handler.prototype.delComment = function(cid, aid) {
		if(!confirm('Confirm to delete this comment?')) {
			return;
		}
		var self = this;
		$$.util.xhr.post('/data/del_comment', {
			param: {cid: cid},
			load: function(o) {
				if(o.ret === 0) {
					ajaxHistory.clearCache();
					self.handle(self.reqInfo.mark, self.reqInfo.fullMark, self.reqInfo);
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
	
	Handler.prototype.handle = function(mark, fullMark, reqInfo, data) {
		if(!this.isCurrentHandler()) {
			return;
		}
		$.css.load(_cssList);
		var self = this;
		var params, aid;
		params = mark.split('/');
		aid = params[0];
		if(!aid) {
			this.error(new $.Error(modId + '01', 'Invalid article id.'), modName);
			return;
		}
		data = data || ajaxHistory.getCache(fullMark);
		if(data) {
			ajaxHistory.setMark(fullMark, [data.article.title, reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
			$$.ui.setMainContent(_tmpl(data));
			$$.ui.turnOnMenu('a');
			$$.storage.get('commentModSequence', function(res) {
				if(res) {
					$.object.each(res.split(' '), function(modId) {
						$('[data-mod-id="' + modId + '"]', '#mainPart').appendTo($('#mainPart'));
					});
				}
				if(params[1] == 'comment') {
					_scrollToComments();
				}
			});
			$$.storage.get('comment_form_data', function(commentFormData) {
				if(commentFormData) {
					commentFormData = $.object.fromQueryString(commentFormData);
					$.object.each(commentFormData, function(val, key) {
						$('#' + key).setVal(val);
					});
				}
			});
			_bindEvent(aid);
			$$.util.prettyPrint();
			this._makeSortable();
			return;
		}
		var url = '/data/' + modKey + '/' + aid;
		if($.Xhr.isUrlLoading(url)) {
			return;
		}
		$$.util.xhr.get(url, {
			gid: this._id,
			callbackName: '_get_article_info',
			load: function(o) {
				ajaxHistory.setCache(fullMark, o.data);
				self.handle(mark, fullMark, reqInfo, data)
			},
			error: function(code) {
				self.error(new $.Error(code, 'Failed to read article ' + aid), modName);
			}, 
			complete: function() {
			},
			noCache: true
		});
	};
	
	return new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, modKey, $$.Handler.mod.root);
});
