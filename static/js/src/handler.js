/**
 * @namespace $$.handler
 */
$$.handler = (function(opt) {
	var _OPTION = _getOption();
	var _MOD_KEY_INFO_HASH = $$.config.get('MOD_KEY_INFO_HASH');
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
		if(mark.indexOf(_MARK_PREFIX) !== 0) {
			return;
		}
		var modInfo = _getModInfo(mark);
		if(!modInfo) {
			alert('Sorry, can not find the page you requested.');
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
		var hash = location.hash.replace(/^#!\/?/, '');
		if(easyHistory.isSupportHistoryState()) {
			if(!pathName) {
				if(_getModInfo(hash)) {
					history.replaceState(null, document.title, '/' + hash);
				}
			} else if(!_getModInfo(pathName) && _getModInfo(hash)) {
				history.replaceState(null, document.title, '/' + hash);
			}
		} else if(!_getModInfo(hash) && _getModInfo(pathName)) {
			location.href = '/#!' + pathName;
		}
		
		$$.ui.init();
		$.Event.addListener(document.body, 'click', function(e) {
			var el = $.Event.getTarget(e);
			var pathName, hash;
			if(el.tagName == 'A') {
				pathName = el.pathname.replace(/^\//, '');
				hash = el.hash.replace(/^#/, '');
				if(pathName.indexOf(_MARK_PREFIX) === 0 && !(pathName == _curMark && hash)) {
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
