/**
 * @namespace easyHistory
 * @author Gary Wang, webyom@gmail.com
 */

var easyHistory = (function() {
	var _IE_FRAME_SRC = '/static/inc/easy_history/history_blank.html';
	var _INTERVAL = 100;
	
	var _userAgent = navigator.userAgent.toLowerCase();
	var _ua = {
		ie: (/msie/).test(_userAgent) && !(/opera/).test(_userAgent),
		safari: (/safari/).test(_userAgent) && !(/chrome/).test(_userAgent) && !(/android/).test(_userAgent)
	};
	var _ieFrame = null;
	var _markCacheIndexHash = {};
	var _cache = [];
	var _cacheEnabled = true;
	var _cacheSize = 100;
	var _previousMark;
	var _currentMark;
	var _listener = null;
	var _listenerBind = null;
	var _isSupportHistoryState = !!history.pushState;
	
	function _updateCurrentMark(mark) {
		if(mark == _currentMark) {
			return;
		}
		_previousMark = _currentMark;
		_currentMark = mark;
		_isOldIe() && _setIeFrameSrc(mark);
	};
	
	function _checkMark(mark) {
		mark = _isValidMark(mark) ? mark : getMark();
		if(_ua.safari && !_isSupportHistoryState && typeof window.onhashchange == 'undefined') {
			setTimeout(arguments.callee, _INTERVAL);
		}
		if(mark == _currentMark || !_isValidMark(mark)) {
			return;
		}
		$.console.log('easyHistory found mark changed, ' + mark);
		_updateCurrentMark(mark);
		_listener && _listener.call(_listenerBind, mark, getCache(mark));
	};
	
	function _setCache(mark, data) {
		if(!_cacheEnabled) {
			return;
		}
		_cache.push(data);
		_markCacheIndexHash[mark] = _cache.length - 1;
		delete _cache[_markCacheIndexHash[mark] - _cacheSize];
	};
	
	function _isOldIe() {
		return _ua.ie && (!document.documentMode || document.documentMode < 8);
	};
	
	function _setIeFrameSrc(mark) {
		if(_ieFrame) {
			if(_ieFrame.contentWindow && _ieFrame.contentWindow.document) {
				var doc = _ieFrame.contentWindow.document;
				if(mark == doc.getElementById('mark').value) {
					return;
				}
				doc.open();
				doc.write([
					'<html>',
						'<head><title>' + document.title + '</title></head>',
						'<body>',
							'<textarea id="mark">' + mark + '</textarea>',
							'<script type="text/javascript">',
								'var mark = document.getElementById("mark").value;',
								'if(mark || parent.location.hash) {',
									'parent.location.hash = "!" + mark;',
								'}',
							'</script>',
						'</body>',
					'</html>'
				].join(''));
				doc.close();
			} else {
				setTimeout(function() {
					_setIeFrameSrc(mark);
				}, 100);
			}
		} else {
			_ieFrame = document.createElement('iframe');
			_ieFrame.id = 'easyHistoryIeFrame';
			_ieFrame.style.display = 'none';
			_ieFrame.src = _IE_FRAME_SRC + '#' + mark;
			_ieFrame = document.body.appendChild(_ieFrame);
		}
	};
	
	function _isValidMark(mark) {
		return typeof mark == 'string' && !(/^[#!\/]/).test(mark);
	};
	
	function _addEvent(obj, eType, listener) {
		if(obj.addEventListener) {
			obj.addEventListener(eType, listener, false);
		} else {
			obj.attachEvent('on' + eType, listener);
		}
	};
	
	//Public
	function init(opt) {
		opt = opt || {};
		_cacheEnabled = typeof opt.cacheEnabled != 'undefined' ? opt.cacheEnabled : _cacheEnabled;
		_cacheSize = opt.cacheSize || _cacheSize;
		if(_isSupportHistoryState) {
			_addEvent(window, 'popstate', _checkMark);
		} else if(!_isOldIe() && typeof window.onhashchange != 'undefined') {
			_addEvent(window, 'hashchange', _checkMark);
		} else if(_ua.safari) {
			setTimeout(_checkMark, _INTERVAL);
		} else {
			setInterval(_checkMark, _INTERVAL);
		}
		var mark = getMark();
		_checkMark(_isValidMark(mark) ? mark : '');
	};
		
	function setListener(listener, bind) {
		_listener = typeof listener == 'function' ? listener : null;
		_listenerBind = bind || null;
	};
	
	function setCache(mark, data) {
		if(!_isValidMark(mark)) {
			return;
		}
		_setCache(mark, data);
	};
	
	function getCache(mark) {
		return _cache[_markCacheIndexHash[mark]];
	};
	
	function clearCache() {
		_markCacheIndexHash = {};
		_cache = [];
	};
	
	function setMark(mark, title, stateObj) {
		if(title) {
			document.title = title;
		}
		if(mark == _currentMark || !_isValidMark(mark)) {
			return;
		}
		_updateCurrentMark(mark);
		if(_isSupportHistoryState) {
			history.pushState(stateObj, title || document.title, '/' + mark);
		} else {
			location.hash = '!' + mark;
		}
	};
	
	function getMark() {
		if(_isSupportHistoryState) {
			return location.pathname.replace(/^\//, '');
		} else {
			return location.hash ? location.hash.replace(/^#!\/?/, '') : '';
		}
	};
	
	function getPrevMark() {
		return _previousMark;	
	};
	
	function isSupportHistoryState() {
		return _isSupportHistoryState;
	};
	
	return {
		init: init,
		setListener: setListener,
		setCache: setCache,
		getCache: getCache,
		clearCache: clearCache,
		setMark: setMark,
		getMark: getMark,
		getPrevMark: getPrevMark,
		isSupportHistoryState: isSupportHistoryState
	};
})();


