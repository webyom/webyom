/**
 * webyom namespace
 * @namespace $$
 */
if(!$$) {
	var $$ = {};
}

/**
 * @namespace $$.mod
 */
$$.mod = {};

/**
 * @namespace $$.config
 */
$$.config = (function() {
	var _updater = {};
	var _config = {
		TITLE_POSTFIX: ' - Webyom - Gary\'s Blog',
		MARK_PREFIX: 'view/',
		DEFAULT_MOD_KEY: 'list',
		LIB_NAME_URL_HASH: {
			'YOM_MOUSE_EVENT': '/static/inc/webyom-js/mouse_event.js',
			'YOM_LOCAL_STORAGE': '/static/inc/webyom-js/local_storage.js',
			'YOM_DRAGDROP': '/static/inc/webyom-js/dragdrop.js',
			'YOM_WIDGET_MASK': '/static/inc/webyom-js/widget/mask.js',
			'YOM_WIDGET_DIALOG': '/static/inc/webyom-js/widget/dialog.js',
			'YOM_WIDGET_TOOLTIP': '/static/inc/webyom-js/widget/tooltip.js',
			'PRETTY_PRINT': '/static/inc/prettify/prettify.js'
		},
		MOD_KEY_NAME_HASH: {
			'list': 'ARTICLE_LIST',
			'read': 'READ_ARTICLE'
		},
		MOD_KEY_INFO_HASH: {//p: 预加载优先级，p越大优先级越高。
			'list': {p: 1, key: 'list', title: 'List', id: 300, name: 'ARTICLE_LIST', url: '/static/js/mod/article_list.js'},
			'read': {p: 2, key: 'read', title: 'Read', id: 301, name: 'READ_ARTICLE', url: '/static/js/mod/read_article.js'},
			'write': {p: 3, key: 'write', title: 'Write', id: 302, name: 'WRITE_ARTICLE', url: '/static/js/mod/write_article.js'}
		},
		SUB_MOD_KEY_INFO_HASH: {}
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
})();

var $$_LIB_NAME_URL_HASH = $$.config.get('LIB_NAME_URL_HASH');
var $$_MOD_KEY_INFO_HASH = $$.config.get('MOD_KEY_INFO_HASH');
var $$_SUB_MOD_KEY_INFO_HASH = $$.config.get('SUB_MOD_KEY_INFO_HASH', function(updated) {
	$$_SUB_MOD_KEY_INFO_HASH = updated;
});
/**
 * @namespace $$.storage
 */
$$.storage = (function() {
	function _do(cb) {
		$.js.require($$.LIB_NAME_URL_HASH['YOM_LOCALSTORAGE'], function(ret) {
			cb();
		});
	};
	
	function get(key, cb) {
		_do(function() {
			$.localStorage.get(key, {proxy: 1, callback: function(res) {
				cb(res);
			}});
		});
	};
	
	function set(key, val, cb) {
		_do(function() {
			$.localStorage.set(key, val, {proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function remove(key, cb) {
		_do(function() {
			$.localStorage.clear(key, {proxy: 1, callback: function(res) {
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
		doUnlessKey: doUnlessKey
	};
})();
/**
 * @namespace $$.util
 */
$$.util = {};

$$.util.xhr = (function() {
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
				opt.error && opt.error.call(this, $.Error.getCode($$.util._ID, 1));
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

$$.util.prettyPrint = function() {
	$.js.require($$_LIB_NAME_URL_HASH['PRETTY_PRINT'], function() {
		prettyPrint();
	}, {silent: 1});
};

$$.util.dialog = (function() {
	var _mask = null;
	var _dialogIdList = [];
	
	function _getDialogZIndex(dialog) {
		return parseInt(dialog.getZIndex()) || 100;
	};
	
	function _getTopDialog() {
		return $.widget.Dialog.getInstanceById(_dialogIdList[0]);
	};
	
	function _onPopup(e) {
		var dialog = $.widget.Dialog.getInstanceById(e.dialogId);
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
		$.widget.Dialog.each(function(dialog) {
			dialog.isFixed() && dialog.centralize();
		});
	};
	
	function _init() {
		_mask = new $.widget.Mask();
		_mask.addEventListener('click', function() {
			var topDialog = _getTopDialog();
			topDialog && topDialog.focus();
		});
		$.widget.Dialog.addEventListener('popup', _onPopup);
		$.widget.Dialog.addEventListener('close', _onClose);
		$.Event.addListener(window, 'resize', _mask.resize, _mask);
		$.Event.addListener(window, 'resize', _centralizeAll);
		$.Event.addListener(window, 'scroll', _centralizeAll);
		_init = $empty;
	};
	
	function popup(opt) {
		$.js.require([true, $$_LIB_NAME_URL_HASH['YOM_WIDGET_MASK'], $$_LIB_NAME_URL_HASH['YOM_WIDGET_DIALOG']], function(ret) {
			_init();
			new $.widget.Dialog(opt).popup();
		});
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
			fx: 'fade',
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
			fx: 'fade',
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
		alert: alert,
		confirm: confirm
	};
})();

var $$alert = $$.util.dialog.alert;
var $$confirm = $$.util.dialog.confirm;
/**
 * @namespace
 */
$$.tooltip = (function() {
	var _guideTooltip;
	var _guidePool = [];
	
	function _showGuide(opt) {
		_guideTooltip = _guideTooltip || new YOM.widget.Tooltip({
			keepAlive: true,
			content: '',
			zIndex: 999,
			fx: 'slide',
			beforeClose: function() {
				setTimeout(function() {
					_guidePool.length && _showGuide(_guidePool.shift());
				}, 500);
			}
		});
		_guideTooltip.setContent(opt.content).popup({
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
	
	function _bindAttr(attr) {
		var _toolTip = null;
		var _toRef = null;
		$(document).addEventListener('mousemove', function(evt) {
			clearTimeout(_toRef);
			var pos = {x: $.Event.getPageX(evt), y: $.Event.getPageY(evt)};
			var target = $($.Event.getTarget(evt));
			var txt = target.getDatasetVal('tooltip');
			if(!txt) {
				if(attr) {
					txt = target.getAttr(attr);
					if(txt) {
						target.setDatasetVal('tooltip', txt);
						target.setAttr(attr, '');
					} else {
						_toolTip && _toolTip.close();
						return;
					}
				} else {
					_toolTip && _toolTip.close();
					return;
				}
			}
			_toRef = setTimeout(function() {
				$.js.require($$_LIB_NAME_URL_HASH['YOM_WIDGET_TOOLTIP'], function(ret) {
					_toolTip = _toolTip || new YOM.widget.Tooltip({
						content: '',
						zIndex: 999,
						fx: 'fade',
						noCloseBtn: true,
						keepAlive: true
					});
					_toolTip.setContent(txt).popup({
						pos: pos,
						offset: {L: {x: -10, y: -15}, B: {x: -15, y: 30}, T: {x: -15, y: -15}}
					});
				});
			}, 200);
		});
		_bindAttr = $empty();
	};
	
	function bindAttr(attr) {
		_bindAttr(attr);
	};
	
	return {
		bindAttr: bindAttr,
		guide: guide
	};
})();
/**
 * @namespace $$.ui
 */
$$.ui = (function() {
	var _USER_NAME = $$userName;
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
			FRAME: $$uiContentTmpl,
			SIDE_WHOAMI: [
				'<p>', 
					'<img src="/static/img/myPhoto.jpg" alt="Who am I?" ondblclick="$.console.turnOn();" />', 
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
		FOOTER : '<span>&copy;2009-2011 Webyom. Designed and Programmed by <a href="mailto:webyom@gmail.com" title="Write a mail to Gary.">Gary</a>. Powered by <a href="http://www.djangoproject.com" target="_blank">Django</a> and <a href="http://github.com/webyom/webyom-js" target="_blank">YOM</a></span><img src="/static/img/django_logo.gif" alt="Powered by Django" /><br class="clearFix" />'
	};
	
	var _sortable = null;
	
	function _initHeader() {
		$('#header').get().innerHTML = _TMPL['HEADER'];
		$('#header').tween(1500, {
			origin: {
				style: 'opacity: 0;'
			},
			target: {
				style: 'left: 0px; opacity: 1;'
			},
			css: true,
			transition: 'easeOut'
		});
	};
	
	function _initContent() {
		resetContent();
	};
	
	function _initFooter() {
		$('#footer').get().innerHTML = _TMPL['FOOTER'];
	};
	
	function resetContent() {
		$('#content').get().innerHTML = _TMPL['CONTENT']['FRAME'];
		$.js.require($$_LIB_NAME_URL_HASH.YOM_LOCAL_STORAGE, function(res) {
			$.localStorage.get('sideModSequence', {proxy: 1, callback: function(res) {
				if(res) {
					$.object.each(res.split(' '), function(modId) {
						$('[data-mod-id="' + modId + '"]', '#sidePart').appendTo($('#sidePart'));
					});
				}
				$('#sideWhoamiContent').get().innerHTML = _TMPL['CONTENT']['SIDE_WHOAMI'];
				$('#sideReadingsContent').get().innerHTML = _TMPL['CONTENT']['SIDE_READINGS'];
				$('#sideRecSites').get().innerHTML = _TMPL['CONTENT']['SIDE_REC_SITES'];
				$('#sidePart').tween(1500, {
					origin: {
						style: 'top: -800px; opacity: 0; position: relative;'
					},
					target: {
						style: 'top: 0px; opacity: 1; position: relative;'
					},
					css: true,
					transition: 'easeOut'
				});
			}});
		});
		$.js.require($$_LIB_NAME_URL_HASH.YOM_DRAGDROP, function(res) {
			try {
				_sortable && _sortable.destory();
			} catch(e) {}
			_sortable = new $.dragdrop.Sortable('#sidePart .sortable', {cloneContainer: YOM('#sidePart'), handles: '.handle', enterDirection: 'V', boundary: 'PAGE', snap: 0, startOff: {left: 5, top: 5}, clone: 0});
			_sortable.addEventListener('sortrelease', function() {
				var tmp = [];
				$('#sidePart .sortable').each(function(el) {
					tmp.push(YOM(el).getDatasetVal('mod-id'));
				});
				$.js.require($$_LIB_NAME_URL_HASH.YOM_LOCAL_STORAGE, function(res) {
					$.localStorage.set('sideModSequence', tmp.join(' '), {proxy: 1});
				});
			});
		});
	};
	
	function turnOnMenu(name) {
		$('#menu').get().className = name;
	};
	
	function init() {
		$(document.body).show();
		_initHeader();
		_initContent();
		_initFooter();
		$$.tooltip.bindAttr('title');
	};
	
	return {
		resetContent: resetContent,
		turnOnMenu: turnOnMenu,
		init: init
	};
})();

/**
 * @namespace $$.ui.processing
 */
$$.ui.processing = (function() {
	var _div;
	
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
			stop();
		});
		$.Xhr.addEventListener('start', function(e) {
			if(e.opt.silent) {
				return;
			}
			start();
		});
		$.Xhr.addEventListener('allcomplete', function(e) {
			stop();
		});
	})();
	
	return {
		start: start,
		stop: stop
	};
})();
/**
 * @namespace $$.handler
 */
$$.handler = (function(opt) {
	var _OPTION = _getOption();
	var _MOD_KEY_INFO_HASH = $$.config.get('MOD_KEY_INFO_HASH');
	var _MARK_PREFIX = $$.config.get('MARK_PREFIX');
	
	var _curMark;
	var _curModInfo = {};
	var _prevModInfo = {};
	var _jsLoaderAbortExcludeIdHash = {
		'/static/js/main.js': 1,
		'/static/inc/webyom-js/mouse_event.js': 1,
		'/static/inc/webyom-js/local_storage.js': 1,
		'/static/inc/webyom-js/dragdrop.js': 1,
		'/static/inc/webyom-js/widget/mask.js': 1,
		'/static/inc/webyom-js/widget/dialog.js': 1,
		'/static/inc/prettify/prettify.js': 1
	};
	
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
	
	function _getPrefixedMark(mark) {
		if(mark.indexOf(_MARK_PREFIX) === 0) {
			return mark;
		}
		return _MARK_PREFIX + mark;
	};
	
	function _loadMod(modInfo, data) {
		var modName = modInfo.name;
		if(modInfo.url) {
			$.js.require(modInfo.url, function(ret) {
				if(ret !== 0) {
					$$alert(
					      'Code: ' + ret + '\n' +
					      'Message: Failed to load module' + modName
					);
					return;
				}
				handler.dispatchEvent(handler.createEvent('loadmod', {
					originMark: $.history.ajax.getPrevMark(),
					targetMark: _curMark,
					originMod: $.object.clone(_prevModInfo, true),
					targetMod: $.object.clone(modInfo, true)
				}));
				$$.mod[modName].handle(modInfo, data);
			});
		} else if(modInfo.handler) {
			modInfo.handler(modInfo);
		}
	};
	
	function _getModInfo(mark) {
		var params = mark.split('/'),
			modKey = params[1],
			subMark = params.slice(2).join('/'),
			modInfo = _MOD_KEY_INFO_HASH[modKey];
		if(modInfo) {
			modInfo.subMark = subMark;
		}
		return modInfo;
	};
	
	function _handle(requestMark, data) {
		var mark = requestMark || (_MARK_PREFIX + $$.config.get('DEFAULT_MOD_KEY'));
		if(mark.indexOf(_MARK_PREFIX) !== 0) {
			return;
		}
		var modInfo = _getModInfo(mark);
		if(!modInfo) {
			$$alert('Sorry, can not find the page you requested.');
			return;
		}
		modInfo.requestMark = requestMark;
		if(handler.dispatchEvent(handler.createEvent('beforeunloadmod', {
			originMark: _curMark,
			targetMark: mark,
			originMod: $.object.clone(_curModInfo, true),
			targetMod: $.object.clone(modInfo, true)
		})) === false) {
			return;
		}
		_curMark = mark;
		_prevModInfo = _curModInfo;
		_curModInfo = modInfo;
		abortAllRequests();
		setTimeout(function() {
			_loadMod(modInfo, data || $.history.ajax.getCache(mark));
		}, 300);
	};
	
	var _jumpCount = 0;
	function jump(mark) {
		if(_jumpCount++ < 10 || $.history.ajax.needFrame()) {
			_handle(mark);
		} else {
			if($.history.isSupportHistoryState) {
				location.href = '/' + mark;
			} else {
				location.href = '/?' + $now() + '#!' + mark;
			}
		}
	};
	
	function error(e, modName) {
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
	};
	
	function abortAllRequests() {
		$.JsLoader.abortAll(_jsLoaderAbortExcludeIdHash);
		$.Xhr.abortAll();
	};
	
	function preloadModList(modList, delay) {
		var mod, obj;
		var list = [];
		for(var id in modList) {
			mod = modList[id];
			if($$.mod[mod.name] || !mod.url) {
				continue;
			}
			list.push(mod);
		}
		list.sort(function(a, b) {
			var r = a.p - b.p;
			return r > 0 ? -1 : r < 0 ? 1 : 0;
		});
		setTimeout(function() {
			for(var i = 0, l = list.length; i < l; i++) {
				$.js.preload(list[i].url);
			}
		}, delay || 0);
	};
	
	function setCache(mark, data) {
		$.history.ajax.setCache(_getPrefixedMark(mark), data);
	};
	
	function getCache(mark) {
		return $.history.ajax.getCache(_getPrefixedMark(mark));
	};
	
	function clearCache() {
		return $.history.ajax.clearCache();
	};
	
	var Handler = function() {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	$.Class.extend(Handler, $.Event);
	var handler = $extend(new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}), {
		_ID: 204,
		jump: jump,
		error: error,
		abortAllRequests: abortAllRequests,
		preloadModList: preloadModList,
		setCache: setCache,
		getCache: getCache,
		clearCache: clearCache
	});
	
	(function() {
		if(_OPTION['console'] == 'on') {
			$.console.turnOn();
		}
		
		var pathName = location.pathname.replace(/^\//, '');
		var hash = location.hash.replace(/^#!\/?/, '');
		if($.history.isSupportHistoryState) {
			if(!pathName) {
				if(_getModInfo(hash)) {
					history.replaceState(null, document.title, '/' + hash);
				}
			} else if(!_getModInfo(pathName) && _getModInfo(hash)) {
				history.replaceState(null, document.title, '/' + hash);
			}
		} else if(!_getModInfo(hash) && _getModInfo(pathName)) {
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
				if(pathName == _curMark && hash) {
					return;
				}
				$.Event.preventDefault(e);
				if(!$.history.isSupportHistoryState && location.pathname.replace(/^\//, '')) {
					location.href = '/#!' + pathName;
				} else {
					jump(pathName);
				}
			}
		});
		
		$.history.ajax.setListener(_handle);
		$.history.ajax.init(opt);
	})();
	
	return handler;
})({
	cacheSize: 1000
});
