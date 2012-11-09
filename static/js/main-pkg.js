/**
 * @namespace $$.config
 */
define('./config', ['require', 'yom/core-pkg'], function(require, $) {
	var _updater = {};
	var _config = {
		TITLE_POSTFIX: 'Webyom - Gary\'s Blog',
		MARK_PREFIX: 'view/',
		DEFAULT_MOD_KEY: 'list',
		MOD_KEY_NAME_HASH: {
			'list': 'ARTICLE_LIST',
			'read': 'READ_ARTICLE'
		},
		MOD_KEY_INFO_HASH: {//p: priority of preload，this bigger p the higher priority。key，id and name must be unique
			'list': {p: 1, key: 'list', title: 'List', id: 300, name: 'ARTICLE_LIST', url: 'mod/article-list'},
			'read': {p: 2, key: 'read', title: 'Read', id: 301, name: 'READ_ARTICLE', url: 'mod/read-article'},
			'write': {p: 3, key: 'write', title: 'Write', id: 302, name: 'WRITE_ARTICLE', url: 'mod/write-article'},
			'about': {p: 4, key: 'about', title: 'About', id: 303, name: 'ABOUT', url: 'mod/about'}
		}
	};
	
	function _update(key) {
		var updaters = _updater[key];
		if(updaters) {
			for(var i = 0, l = updaters.length; i < l; i++) {
				updaters[i].call(null, get(key));
			}
		}
	};
	
	function get(key, updater) {
		if(typeof updater == 'function') {
			_updater[key] = _updater[key] || [];
			_updater[key].push(updater);
		}
		return $.object.clone(_config[key], true);
	};
	
	function set(key, val) {
		_config[key] = val;
		_update(key);
		return 0;
	};
	
	function extend(key, obj) {
		if(typeof _config[key] != 'object') {
			return 1;
		}
		for(var p in obj) {
			_config[key][p] = obj[p];
		}
		_update(key);
		return 0;
	};
	
	return {
		_ID: 200,
		get: get,
		set: set,
		extend: extend
	};
});


/**
 * @namespace $$.storage
 */
define('./storage', ['require'], function(require) {
	function _do(cb) {
		require(['yom/local-storage'], function(ls) {
			cb(ls);
		});
	};
	
	function get(key, cb) {
		_do(function(ls) {
			ls.get(key, {proxy: 1, callback: function(res) {
				cb(res);
			}});
		});
	};
	
	function set(key, val, cb) {
		_do(function(ls) {
			ls.set(key, val, {proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function remove(key, cb) {
		_do(function(ls) {
			ls.remove(key, {proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function clear(cb) {
		_do(function(ls) {
			ls.clear({proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function doUnlessKey(key, cb, opt) {
		opt = opt || {};
		get(key, function(val) {
			if(val || opt.test && opt.test(val)) {
				return;
			}
			cb();
			if(typeof opt.set == 'function') {
				val = opt.set(val);
				val === false || set(key, val);
			} else if(opt.set) {
				set(key, opt.set);
			}
		});
	};
	
	return {
		get: get,
		set: set,
		remove: remove,
		clear: clear,
		doUnlessKey: doUnlessKey
	};
});


/**
 * @namespace $$.tooltip
 */
define('./tooltip', ['require', 'yom/core-pkg'], function(require, $) {
	var _guideTooltip;
	var _guidePool = [];
	
	function _getElTips(el, attr) {
		if(!el) {
			return '';
		}
		el = $(el);
		var tips = el.getDatasetVal('tooltip');
		if(!tips && attr) {
			tips = el.getAttr(attr);
			if(tips) {
				el.setDatasetVal('tooltip', tips);
				el.setAttr(attr, '');
			}
		}
		return tips;
	};
	
	function _showGuide(opt) {
		_guideTooltip = _guideTooltip || new YOM.widget.Tooltip({
			keepAlive: true,
			content: '',
			zIndex: opt.zIndex || 99,
			beforeClose: function() {
				setTimeout(function() {
					_guidePool.length && _showGuide(_guidePool.shift());
				}, 500);
			}
		});
		_guideTooltip.setContent(opt.content).popup({
			fx: opt.fx || 'slide',
			pos: opt.pos,
			direction: opt.direction,
			closeTimeout: opt.closeTimeout,
			target: opt.target,
			offset: opt.offset
		});
	}
	
	function guide(opt) {
		opt = opt || {};
		$.js.require($$_LIB_NAME_URL_HASH['YOM_WIDGET_TOOLTIP'], function(ret) {
			if(!_guideTooltip || _guideTooltip.isClosed() || opt.prior) {
				_showGuide(opt);
			} else {
				_guidePool.push(opt);
			}
		});
		return this;
	};
	
	function _bindAttr(opt) {
		var toolTip = null;
		var toRef = null;
		var attr = opt.attr;
		var maxBubble = opt.maxBubble || 0;
		$(document).addEventListener('mousemove', function(evt) {
			clearTimeout(toRef);
			var pos = {x: $.Event.getPageX(evt), y: $.Event.getPageY(evt)};
			var target = $.Event.getTarget(evt);
			var txt = _getElTips(target, attr);
			var times = 0;
			while(!txt && times < opt.maxBubble) {
				target = target.parentNode;
				txt = _getElTips(target, attr);
				times++;
			}
			if(!txt) {
				toolTip && toolTip.close();
				return;
			}
			toRef = setTimeout(function() {
				require(['yom/widget/tooltip'], function(Tooltip) {
					var opt = {};
					txt = txt.replace((/^\[([^\]]+?)\]/), function(m, c) {
						c = c.split(',');
						$.array.each(c, function(item) {
							var key, val;
							item = item.split(':');
							key = $.string.trim(item[0]);
							val = $.string.trim(item[1]);
							if(!key) {
								return;
							}
							opt[key] = val;
						});
						return '';
					});
					toolTip = toolTip || new Tooltip({
						content: '',
						zIndex: 999,
						noCloseBtn: true,
						keepAlive: true
					});
					toolTip.setContent(txt).popup({
						direction: opt.direction,
						fx: opt.fx || 'fade',
						pos: pos,
						offset: {L: {x: -10, y: -15}, B: {x: -15, y: 30}, T: {x: -15, y: -15}}
					});
				});
			}, 200);
		});
		_bindAttr = $empty();
	};
	
	function bindAttr(opt) {
		opt = opt || {};
		_bindAttr(opt);
	};
	
	return {
		bindAttr: bindAttr,
		guide: guide
	};
});


/**
 * @namespace $$.ui
 */
define('./ui', ['require', 'yom/core-pkg', './storage', './tooltip'], function(require, $, storage, tooltip) {
	var _USER_NAME = window.$$userName;
	var _TMPL = {
		HEADER: [
			'<h1>Webyom</h1>', 
			'<ul id="menu">', 
				'<li class="a"><a href="/view/list">Blog</a></li>', 
				//'<li class="b"><a href="/#work">My Work</a></li>', 
				'<li class="b"><a href="/view/bookmark">Bookmark</a></li>', 
				'<li class="c"><a href="/view/about">About</a></li>', 
			'</ul>', 
			'<div id="loginInfo">' + (_USER_NAME ? 'Welcome, ' + _USER_NAME + '! <a href="/logout/">logout&gt;&gt;</a>' : 'Welcome, guest!') + '</div>'
		].join(''),
		CONTENT: {
			FRAME: window.$$uiContentTmpl,
			SIDE_WHOAMI: [
				'<p>', 
					'<img src="/static/img/myPhoto.jpg" alt="Who am I?" />', 
					'Hi, my name is Gary Wang.<br /><br />', 
					'I\'m living in Shenzhen China, and working as a front-end developer.<br /><br />', 
					'I love programming in Javascript, CSS, and HTML. Recently I\'m studying Python. I found Python a extramely good programming language, thus I started to build this blog with it.', 
				'</p>'
			].join(''),
			SIDE_READINGS: [
				'<ul>', 
					'<li><a href="http://www.amazon.com/Learning-Website-Development-Django-applications/dp/1847193358" target="_blank">Learn Website Development with Django<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
					'<li><a href="http://www.amazon.com/Passionate-Programmer-Remarkable-Development-Pragmatic/dp/1934356344" target="_blank">The Passionate Programmer<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
				'</ul>'
			].join(''),
			SIDE_REC_SITES: [
				'<ul>', 
					'<li><a href="http://isd.tencent.com/" target="_blank">Tencent ISD<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
					'<li><a href="http://cdc.tencent.com/" target="_blank">Tencent CDC<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
				'</ul>'
			].join('')
		},
		FOOTER : '<span>&copy;2009-2011 Webyom. Designed and Programmed by <a href="mailto:webyom@gmail.com" title="Write a mail to Gary.">Gary</a>. Powered by <a href="http://www.djangoproject.com" target="_blank">Django</a> and <a href="http://github.com/webyom/yom" target="_blank">YOM</a></span><img src="/static/img/django-logo.gif" alt="Powered by Django" /><br class="clearFix" />'
	};
	
	var _sortable = null;
	
	function _initHeader() {
		$('#header').get().innerHTML = _TMPL['HEADER'];
	};
	
	function _initContent() {
		resetContent();
	};
	
	function _initFooter() {
		$('#footer').get().innerHTML = _TMPL['FOOTER'];
	};
	
	function resetContent() {
		$('#content').setHtml(_TMPL['CONTENT']['FRAME']);
		storage.get('sideModSequence', function(res) {
			if(res) {
				$.object.each(res.split(' '), function(modId) {
					$('[data-mod-id="' + modId + '"]', '#sidePart').appendTo($('#sidePart'));
				});
			}
			$('#sideWhoamiContent').get().innerHTML = _TMPL['CONTENT']['SIDE_WHOAMI'];
			$('#sideReadingsContent').get().innerHTML = _TMPL['CONTENT']['SIDE_READINGS'];
			$('#sideRecSites').get().innerHTML = _TMPL['CONTENT']['SIDE_REC_SITES'];
		});
		require(['yom/dragdrop-pkg'], function(dragdrop) {
			try {
				_sortable && _sortable.destory();
			} catch(e) {}
			_sortable = new dragdrop.Sortable('#sidePart .sortable', {cloneContainer: $('#sidePart'), handles: '.handle', enterDirection: 'V', boundary: 'PAGE', snap: 0, startOff: {left: 5, top: 5}, clone: 0});
			_sortable.addEventListener('sortrelease', function() {
				var tmp = [];
				$('#sidePart .sortable').each(function(el) {
					tmp.push($(el).getDatasetVal('mod-id'));
				});
				storage.set('sideModSequence', tmp.join(' '));
			});
		});
		return this;
	};
	
	function setContent(content) {
		$('#content').setHtml(content).fadeIn();
		return this;
	};
	
	function setMainContent(content) {
		$('#mainPart').size() || resetContent();
		$('#mainPart').setHtml(content).fadeIn();
		return this;
	};
	
	function turnOnMenu(name) {
		$('#menu').get().className = name;
		return this;
	};
	
	function init() {
		_initHeader();
		_initContent();
		_initFooter();
		tooltip.bindAttr({attr: 'title', maxBubble: 2});
		return this;
	};
	
	var processing = (function() {
		var _div;
		
		function isAnyLoading() {
			return $.JsLoader.isAnyLoading() || $.Xhr.isAnyLoading() || $.CrossDomainPoster.isAnyLoading();
		};
		
		function start(msg) {
			_div.innerHTML = msg || 'Processing...';
			_div.style.display = 'block';
			document.getElementById('content').className = 'processing';
		};
		
		function stop() {
			_div.style.display = 'none';
			document.getElementById('content').className = '';
		};
		
		(function() {
			_div = document.body.appendChild($.Element.create('div', {id: 'processingDiv'}, {display: 'none'}));
			$.JsLoader.addEventListener('start', function(e) {
				if(e.opt.silent) {
					return;
				}
				start();
			});
			$.JsLoader.addEventListener('allcomplete', function(e) {
				if(!isAnyLoading()) {
					stop();
				}
			});
			$.Xhr.addEventListener('start', function(e) {
				if(e.opt.silent) {
					return;
				}
				start();
			});
			$.Xhr.addEventListener('allcomplete', function(e) {
				if(!isAnyLoading()) {
					stop();
				}
			});
			$.CrossDomainPoster.addEventListener('start', function(e) {
				if(e.opt.silent) {
					return;
				}
				start();
			});
			$.CrossDomainPoster.addEventListener('allcomplete', function(e) {
				if(!isAnyLoading()) {
					stop();
				}
			});
		})();
		
		return {
			isAnyLoading: isAnyLoading,
			start: start,
			stop: stop
		};
	})();
	
	return {
		resetContent: resetContent,
		setContent: setContent,
		setMainContent: setMainContent,
		turnOnMenu: turnOnMenu,
		init: init,
		processing: processing
	};
});


/**
 * @namespace $$.util
 */
define('./util', ['require', 'yom/core-pkg'], function(require, $) {
	var util = {
		_ID: 202
	};
	
	var requireAsyn = require;
	
	util.xhr = (function() {
		function _process(opt) {
			opt = opt || {};
			var load = opt.load;
			opt.load = function(res) {
				var cbn = opt.callbackName || '_callBack';
				if(!new RegExp('^\\s*' + cbn).test(res)) {
					res = cbn + '(' + res + ')';
				}
				try {
					res = (new Function(['var res = {}, ', cbn, ' = function (r) { res = r; }; ', res, '; return res'].join('')))();
				} catch(e) {
					opt.error && opt.error.call(this, $.Error.getCode(util._ID, 1));
					return;
				}
				load && load.call(this, res);
			};
			return opt;
		};
			
		function get(url, opt) {
			opt = _process(opt);
			var xhr = new $.Xhr(url, $extend(opt, {
				method: 'GET'
			}));
			xhr.send();
			return xhr;
		};
		
		function post(url, opt) {
			opt = _process(opt);
			if(typeof opt.param == 'string') {
				opt.param = opt.param + '&csrfmiddlewaretoken=' + $.cookie.get('csrftoken');
			} else {
				opt.param = $extend(opt.param, {csrfmiddlewaretoken: $.cookie.get('csrftoken')});
			}
			var xhr = new $.Xhr(url, $extend(opt, {
				method: 'POST'
			}));
			xhr.send();
			return xhr;
		};
		
		return {
			get: get,
			post: post
		};
	})();
	
	util.prettyPrint = function() {
		require(['prettify'], function(prettyPrint) {
			prettyPrint();
		});
	};
	
	util.dialog = (function() {
		var _mask = null;
		var _dialogIdList = [];
		
		function _getDialogZIndex(dialog) {
			return parseInt(dialog.getZIndex()) || 100;
		};
		
		function _getTopDialog() {
			var Dialog = requireAsyn('yom/widget/dialog');
			return Dialog && Dialog.getInstanceById(_dialogIdList[0]);
		};
		
		function _onPopup(e) {
			var Dialog = requireAsyn('yom/widget/dialog');
			var dialog = Dialog.getInstanceById(e.dialogId);
			var topDialog = _getTopDialog();
			if(topDialog) {
				dialog.setZIndex(_getDialogZIndex(topDialog) + 10);
			} else {
				dialog.setZIndex(_getDialogZIndex(dialog));
			}
			_mask.setStyle('z-index', _getDialogZIndex(dialog) - 1);
			_mask.show();
			_dialogIdList.unshift(e.dialogId);
		};
		
		function _onClose(e) {
			for(var i = 0, l = _dialogIdList.length; i < l; i++) {
				if(e.dialogId == _dialogIdList[i]) {
					_dialogIdList.splice(i, 1);
					break;
				}
			}
			if(_dialogIdList.length) {
				_mask.setStyle('z-index', _getDialogZIndex(_getTopDialog()) - 1);
			} else {
				_mask.hide();
			}
		};
		
		function _closeDialog(dialog) {
			dialog && dialog.close();
			var topDialog = _getTopDialog();
			topDialog && dialog != topDialog && topDialog.focus();
		};
		
		function _centralizeAll() {
			var Dialog = requireAsyn('yom/widget/dialog');
			Dialog.each(function(dialog) {
				dialog.isFixed() && dialog.centralize();
			});
		};
		
		function _init() {
			var Mask = requireAsyn('yom/widget/mask');
			var Dialog = requireAsyn('yom/widget/dialog');
			_mask = new Mask();
			_mask.addEventListener('click', function() {
				var topDialog = _getTopDialog();
				topDialog && topDialog.focus();
			});
			Dialog.addEventListener('popup', _onPopup);
			Dialog.addEventListener('close', _onClose);
			$.Event.addListener(window, 'resize', _mask.resize, _mask);
			$.Event.addListener(window, 'resize', _centralizeAll);
			$.Event.addListener(window, 'scroll', _centralizeAll);
			_init = $empty;
		};
		
		function popup(opt, instGetter) {
			opt = opt || {};
			opt.fx = typeof opt.fx == 'undefined' ? 'slideDown' : opt.fx;
			require(['yom/widget/mask', 'yom/widget/dialog'], function(Mask, Dialog) {
				_init();
				(instGetter || $empty).call(null, new Dialog(opt).popup());
			}, function(code) {
				alert('Require error code: ' + code);
			});
		};
		
		function close(opt) {
			opt = opt || {};
			opt.fx = typeof opt.fx == 'undefined' ? 'slideDown' : opt.fx;
			var topDialog = _getTopDialog();
			topDialog && topDialog.close(opt);
		};
		
		function alert(msg, opt) {
			opt = opt || {};
			opt.closeTimeout = opt.closeTimeout >= 0 ? opt.closeTimeout : 3000;
			popup($extend({
				width: opt.width || 300,
				height: opt.height || 100,
				content: msg,
				contentPadding: 10,
				dragHandles: '[data-type="yom-dialog-footer"]',
				focus: '[data-type="yom-dialog-footer"] button',
				fx: 'slideUp',
				tips: opt.closeTimeout > 0 ? '{{s}} seconds to close. {{c:cancel}}' : '',
				btns: opt.noBtn ? null : [
					{text: 'Close', className: 'strong', click: function() {
						_closeDialog(this);
					}}
				]
			}, opt));
		};
		
		function confirm(msg, opt) {
			opt = opt || {};
			popup({
				width: opt.width || 300,
				height: opt.height || 100,
				content: msg,
				contentPadding: 10,
				dragHandles: '[data-type="yom-dialog-footer"]',
				focus: '[data-type="yom-dialog-footer"] button',
				fx: 'slideUp',
				btns: [
					{text: 'Yes', className: 'strong', click: function() {
						_closeDialog(this);
						opt.confirm && opt.confirm();
					}},
					{text: 'No', click: function() {
						_closeDialog(this);
						opt.cancel && opt.cancel();
					}}
				]
			});
		};
		
		return {
			popup: popup,
			close: close,
			alert: alert,
			confirm: confirm
		};
	})();
	
	return util;
});

function $$alert(msg, opt) {
	require(['main-pkg'], function($$) {
		$$.util.dialog.alert(msg, opt);
	});
};
function $$confirm(msg, opt) {
	require(['main-pkg'], function($$) {
		$$.util.dialog.confirm(msg, opt);
	});
};



/**
 * @namespace $$.Handler
 */
define('./handler', ['require', 'yom/core-pkg', 'yom/history', './config', './ui'], function(require, $, ajaxHistory, config, ui) {
	var $$ = {
		config: config,
		ui: ui
	};
	
	var _ID = 204;
	
	var Handler = function(observers, modKey, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
		opt = opt || {};
		this._activeUnload = typeof opt.activeUnload == 'undefined' ? this._activeUnload : opt.activeUnload;
		this._modKeyInfoHash = opt.modKeyInfoHash || {};
		this._defaultModkey = opt.defaultModkey || '';
		this._markPrefix = opt.markPrefix || '';
		this._prevMark = '';
		this._curMark = '';
		this._prevModInfo = null;
		this._curModInfo = null;
		this.mod = {};
		this._unloaded = false;
		this._key = modKey;
		this._parent = parent;
		this._parent.mod[this._key] = this;
		this._bound = {
			beforeunloadmodHook: $bind(this, this._beforeunloadmodHook),
			loadmodHook: $bind(this, this._loadmodHook)
		};
		if(this._key != 'root') {
			this._parent.addEventListener('beforeunloadmod', this._bound.beforeunloadmodHook);
			this._parent.addEventListener('loadmod', this._bound.loadmodHook);
		}
		this._id = $getUniqueId();
	};
	
	Handler.mod = {};
	
	$.Class.extend(Handler, $.Event);
	
	$extend(Handler.prototype, {
		_activeUnload: false,
		
		_beforeunloadmodHook: function(e) {
			return this.dispatchEvent(this.createEvent('beforeunloadmod', {
				originMark: this._curMark,
				targetMark: '',
				originMod: $.object.clone(this._curModInfo, true),
				targetMod: $.object.clone(e.targetMod, true)
			}));
		},
		
		_loadmodHook: function(e) {
			if(e.parentUnloaded || e.originMod && e.originMod.key == this._key && e.targetMod.key != this._key) {
				this.dispatchEvent(this.createEvent('loadmod', {
					parentUnloaded: this._unload(e.parentUnloaded),
					originMark: this._curMark,
					targetMark: '',
					originMod: $.object.clone(this._curModInfo, true),
					targetMod: $.object.clone(e.targetMod, true)
				}));
				if(this._unloaded) {
					this._parent.removeEventListener('beforeunloadmod', this._bound.beforeunloadmodHook);
					this._parent.removeEventListener('loadmod', this._bound.loadmodHook);
				}
			}
		},
		
		_unload: function(parentUnloaded) {
			if(this._activeUnload || parentUnloaded) {
				$.js.unload(this.getModInfo().url);
				this._parent.mod[this._key] = null;
				this._unloaded = true;
			}
			return this._unloaded;
		},
	
		_loadMod: function(subReqInfo) {
			var self = this;
			var modInfo = subReqInfo.modInfo;
			if(modInfo.url) {
				require([modInfo.url], function(mod) {
					self.dispatchEvent(self.createEvent('loadmod', {
						originMark: self._prevMark,
						targetMark: self._curMark,
						originMod: $.object.clone(self._prevModInfo, true),
						targetMod: $.object.clone(modInfo, true)
					}));
					mod.handle(subReqInfo.mark, subReqInfo.fullMark, subReqInfo);
				}, function(errCode) {
					$$alert(
						'Code: ' + errCode + '\n' +
						'Message: Failed to load module ' + modInfo.name
					);
				});
			} else if(modInfo.handler) {
				self.dispatchEvent(self.createEvent('loadmod', {
					originMark: self._prevMark,
					targetMark: self._curMark,
					originMod: $.object.clone(self._prevModInfo, true),
					targetMod: $.object.clone(modInfo, true)
				}));
				modInfo.handler.handle(subReqInfo.mark, subReqInfo.fullMark, subReqInfo);
			}
		},
		
		_getSubReqInfo: function(mark, fullMark) {
			var params = mark.replace(new RegExp(('^' + this._markPrefix).replace('/', '\\/')), '').split('/'),
				modKey = params[0],
				subMark = params.slice(1).join('/'),
				modInfo = this._modKeyInfoHash[modKey];
			return {
				mark: subMark,
				fullMark: fullMark,
				modInfo: modInfo
			};
		},
		
		getCurrentMark: function() {
			return this._curMark;
		},
		
		getCurrentModInfo: function() {
			return this._curModInfo;
		},
		
		getModInfo: function() {
			return this.key == 'root' ? {} : this._parent._modKeyInfoHash[this._key];
		},
		
		getParentModInfo: function() {
			return this._parent.getModInfo();
		},
		
		isCurrentHandler: function() {
			if(this._key == 'root') {
				return true;
			}
			var modInfo = this._parent.getCurrentModInfo();
			return this._parent.isCurrentHandler() && modInfo && modInfo.key == this._key;
		},
		
		error: function(e, modName) {
			if(e instanceof $.Error) {
				$$alert(
				      (modName ? 'Module: ' + modName + '\n' : '') +
				      'Code: ' + e.code + '\n' +
				      'Message: ' + e.message
				);
			} else {
				$$alert(
				      (modName ? 'Module: ' + modName + '\n' : '') +
				      (typeof e == 'number' ? 'Code: ' + e + '\n' : '') +
				      'Message: Sorry!'
				);
			}
		},
		
		abort: function() {
			$.JsLoader.abortAll(this._id);
			$.Xhr.abortAll(this._id);
		},
		
		handle: function(mark, fullMark, reqInfo) {
			if(!this.isCurrentHandler()) {
				return 1;
			}
			var self = this;
			var rawMark = mark;
			fullMark = fullMark || mark;
			mark = mark || (this._markPrefix + this._defaultModkey);
			if(this._markPrefix && mark.indexOf(this._markPrefix) !== 0) {
				return 2;
			}
			var subReqInfo = this._getSubReqInfo(mark, fullMark);
			if(!subReqInfo.modInfo) {
				$$alert('Sorry, can not find the page you requested.');
				return 3;
			}
			if(this.dispatchEvent(this.createEvent('beforeunloadmod', {
				originMark: this._curMark,
				targetMark: mark,
				originMod: $.object.clone(this._curModInfo, true),
				targetMod: $.object.clone(subReqInfo.modInfo, true)
			})) === false) {
				return 4;
			}
			/*
			try {
				this.mod[this._curModInfo.name].abort();
			} catch(e) {}
			*/
			this._prevMark = this._curMark;
			this._curMark = mark;
			this._prevModInfo = this._curModInfo;
			this._curModInfo = subReqInfo.modInfo;
			setTimeout(function() {
				self._loadMod(subReqInfo);
			}, 300);
			return 0;
		}
	});
	
	(function() {
		var _MARK_PREFIX = $$.config.get('MARK_PREFIX');
		var _OPTION = _getOption();
		
		function _getOption() {
			var m, n, opt;
			var m = location.hash.match(/\?(.+)/);
			opt = {};
			if(m) {
				m = m[1].split('&');
				for(var i = 0, l = m.length; i < l; i++) {
					n = m[i].split('=');
					opt[n[0]] = n[1];
				}
			}
			$$.config.set('OPTION', opt);
			return $$.config.get('OPTION');
		};
		
		var _jumpCount = 0;
		function jump(mark) {
			if(_jumpCount++ < 10000 || ajaxHistory.needFrame()) {
				handler.handle(mark);
			} else {
				if(ajaxHistory.isSupportHistoryState()) {
					location.href = '/' + mark;
				} else {
					location.href = '/?' + $now() + '#!' + mark;
				}
			}
		};
		
		var handler = $extend(new Handler({
			beforeunloadmod: new $.Observer(),
			loadmod: new $.Observer()
		}, 'root', Handler, {
			modKeyInfoHash: $$.config.get('MOD_KEY_INFO_HASH'),
			defaultModkey: $$.config.get('DEFAULT_MOD_KEY'),
			markPrefix: _MARK_PREFIX
		}), {
			_ID: 205,
			jump: jump
		});
		
		(function() {
			if(_OPTION['console'] == 'on') {
				require(['yom/ext-pkg'], function($) {
					$.console.turnOn();
				});
			}
			
			var pathName = location.pathname.replace(/^\//, '');
			var hash = location.hash.replace(/^#!\/?/, '');
			var pathNameReqInfo = handler._getSubReqInfo(pathName);
			var hashReqInfo = handler._getSubReqInfo(hash);
			if(ajaxHistory.isSupportHistoryState()) {
				if(!pathName) {
					if(hashReqInfo.modInfo) {
						history.replaceState(null, document.title, '/' + hash);
					}
				} else if(!pathNameReqInfo.modInfo && hashReqInfo.modInfo) {
					history.replaceState(null, document.title, '/' + hash);
				}
			} else if(!hashReqInfo.modInfo && pathNameReqInfo.modInfo) {
				location.hash = '!' + pathName;
			}
			
			$$.ui.init();
			$.Event.addListener(document.body, 'click', function(e) {
				var el = $.Event.getTarget(e);
				var pathName, hash;
				if(el.tagName == 'A') {
					pathName = el.pathname.replace(/^\//, '');
					hash = el.hash.replace(/^#/, '');
					if(el.target) {
						return;
					}
					if(pathName.indexOf(_MARK_PREFIX) !== 0) {
						return;
					}
					if(pathName == handler.getCurrentMark() && hash) {
						return;
					}
					$.Event.preventDefault(e);
					if(!ajaxHistory.isSupportHistoryState() && location.pathname.replace(/^\//, '')) {
						location.href = '/#!' + pathName;
					} else {
						jump(pathName);
					}
				}
			});
			
			ajaxHistory.setListener(handler.handle, handler);
			ajaxHistory.init({cacheSize: 1000});
		})();
	})();
	
	return Handler;
});


/**
 * @namespace $$
 */
define(['require', 'exports', 'module', './config', './storage', './tooltip', './ui', './util', './handler'], function(require) {
	var $$ = {
		config: require('./config'),
		storage: require('./storage'),
		tooltip: require('./tooltip'),
		ui: require('./ui'),
		util: require('./util'),
		Handler: require('./handler')
	};
	
	return $$;
});
