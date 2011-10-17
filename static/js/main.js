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
			'WYJS_MOUSE_EVENT': '/static/inc/webyom-js/mouse_event.js',
			'PRETTY_PRINT': '/static/inc/prettify/prettify.js'
		},
		MOD_NAME_URL_HASH: {
			'ARTICLE_LIST': '/static/js/mod/article_list.js',
			'READ_ARTICLE': '/static/js/mod/read_article.js'
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
		SUB_MOD_KEY_INFO_HASH: {},
		ANCHOR_HASH: {}
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
		return $.object.clone(_config[key]);
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
		FOOTER : '<span>&copy;2009-2011 Webyom. Designed and Programmed by <a href="mailto:webyom@gmail.com" title="Write a mail to Gary.">Gary</a></span><img src="/static/img/django_logo.gif" alt="Powered by Django" /><br class="clearFix" />'
	};
	
	function _initHeader() {
		$('#header').get().innerHTML = _TMPL['HEADER'];
		$('#header').tween(1500, {
			origin: {
				style: 'opacity: 0;'
			},
			target: {
				style: 'left: 0px; opacity: 1;'
			},
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
		$('#sideWhoamiContent').get().innerHTML = _TMPL['CONTENT']['SIDE_WHOAMI'];
		$('#sideReadingsContent').get().innerHTML = _TMPL['CONTENT']['SIDE_READINGS'];
		$('#sideRecSites').get().innerHTML = _TMPL['CONTENT']['SIDE_REC_SITES'];
		$('#sidePart').tween(1500, {
			origin: {
				style: 'top: -800px; opacity: 0; position: relative;'
			},
			target: {
				style: 'top: 0px; opacity: 1; position: static;'
			},
			transition: 'easeOut'
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
			start();
		});
		$.JsLoader.addEventListener('allcomplete', function(e) {
			stop();
		});
		$.Xhr.addEventListener('start', function(e) {
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
	var _ANCHOR_HASH = $$.config.get('ANCHOR_HASH');
	var _TITLE_POSTFIX = $$.config.get('TITLE_POSTFIX');
	var _MARK_PREFIX = $$.config.get('MARK_PREFIX');
	
	var _curMark;
	var _curModInfo = {};
	var _jsLoaderAbortExcludeIdHash = {};
	
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
	
	function _isAnchor(mark) {
		return mark.indexOf('anchor') === 0 || _ANCHOR_HASH[mark];
	};
	
	function _loadMod(modInfo, subMark, data) {
		var modName = modInfo.name;
		if(modInfo.url) {
			$.js.require(modInfo.url, function(ret) {
				if(ret !== 0) {
					alert(
					      'Code: ' + ret + '\n' +
					      'Message: Failed to load module' + modName
					);
					return;
				}
				$$.mod[modName].handle(subMark, data);
			});
		} else if(modInfo.handler) {
			modInfo.handler(subMark);
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
	
	function _handle(m, data) {
		var mark = m || (_MARK_PREFIX + $$.config.get('DEFAULT_MOD_KEY'));
		/*
		if(mark == _curMark) {
			return;
		}
		*/
		var modInfo = _getModInfo(mark);
		if(!modInfo) {
			if(_isAnchor(mark)) {
				location.hash = mark;
			} else {
				alert('Sorry, can not find the page you requested.');
			}
			return;
		}
		if(handler.dispatchEvent(handler.createEvent('beforeunloadmod', {
			originMark: _curMark,
			targetMark: mark,
			originMod: $.object.clone(_curModInfo),
			targetMod: $.object.clone(modInfo)
		})) === false) {
			return;
		}
		easyHistory.setMark(m, modInfo.title + _TITLE_POSTFIX);
		_curMark = m;
		_curModInfo = modInfo;
		abortAllRequests();
		setTimeout(function() {
			_loadMod(modInfo, modInfo.subMark, data || easyHistory.getCache(mark));
		}, 300);
	};
	
	function jump(mark) {
		_handle(mark);
	};
	
	function error(e, modName) {
		if(e instanceof $.Error) {
			alert(
			      (modName ? 'Module: ' + modName + '\n' : '') +
			      'Code: ' + e.code + '\n' +
			      'Message: ' + e.message
			);
		} else {
			alert(
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
		easyHistory.setCache(_getPrefixedMark(mark), data);
	};
	
	function getCache(mark) {
		return easyHistory.getCache(_getPrefixedMark(mark));
	};
	
	function clearCache() {
		return easyHistory.clearCache();
	};
	
	var Handler = function() {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	$.Class.extend(Handler, $.Event);
	var handler = $extend(new Handler({
		beforeunloadmod: new $.Observer()
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
		var hash = location.hash.replace(/^#/, '');
		if(easyHistory.isSupportHistoryState()) {
			if(!pathName) {
				if(_getModInfo(hash)) {
					history.replaceState(null, document.title, '/' + hash);
				}
			} else if(!_getModInfo(pathName) && _getModInfo(hash)) {
				history.replaceState(null, document.title, '/' + hash);
			}
		} else if(!_getModInfo(hash) && _getModInfo(pathName)) {
			location.hash = pathName;
		}
		
		$$.ui.init();
		
		$.Event.addListener(document.body, 'click', function(e) {
			var el = $.Event.getTarget(e);
			var pathName, hash;
			if(el.tagName == 'A') {
				pathName = el.pathname.replace(/^\//, '');
				hash = el.hash.replace(/^#/, '');
				if(pathName.indexOf(_MARK_PREFIX) === 0 && !(pathName == _curMark && _isAnchor(hash))) {
					jump(pathName);
					$.Event.preventDefault(e);
				}
			}
		});
		
		easyHistory.setListener(_handle);
		easyHistory.init(opt);
	})();
	
	return handler;
})({
	cacheSize: 1000
});

/**
 * @namespace $$.util
 */
$$.util = {};

$$.util.xhr = (function() {
	function _process(xhr, opt) {
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
				opt.error.call(this, $.Error.getCode($$.util._ID, 1));
				return;
			}
			load && load.call(this, res);
		};
		xhr.send();
	};
		
	function get(url, opt) {
		var xhr = new $.Xhr(url, $extend(opt, {
			method: 'GET'
		}));
		_process(xhr, opt);
		return xhr;
	};
	
	function post(url, opt) {
		opt = opt || {};
		if(typeof opt.param == 'string') {
			opt.param = opt.param + '&csrfmiddlewaretoken=' + $.cookie.get('csrftoken');
		} else {
			opt.param = $extend(opt.param, {csrfmiddlewaretoken: $.cookie.get('csrftoken')});
		}
		var xhr = new $.Xhr(url, $extend(opt, {
			method: 'POST'
		}));
		_process(xhr, opt);
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
	});
};

