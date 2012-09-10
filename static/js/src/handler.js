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
	
	function jump(mark) {
		_handle(mark);
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
