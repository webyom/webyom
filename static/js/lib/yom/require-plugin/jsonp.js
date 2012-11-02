/**
 * YOM require jsonp plugin
 */
define('require-plugin/jsonp', ['global'], function(global) {
	var _head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	var _callbackQueueHash = {};
	var _callbackLoadingHash = {};
	var _cache = {};
	
	function _clear(jsEl, callbackName, onload, onerror) {
		if(jsEl.addEventListener)  {
			jsEl.removeEventListener('load', onload, false);
			jsEl.removeEventListener('error', onerror, false);
		} else {
			jsEl.detachEvent('onreadystatechange', onload);
		}
		jsEl.parentNode.removeChild(jsEl);
		_callbackLoadingHash[callbackName] = 0;
		if(_callbackQueueHash[callbackName] && _callbackQueueHash[callbackName].length) {
			_load.apply(null, Array.prototype.slice.call(_callbackQueueHash[callbackName].shift()));
		}
	};
	
	function _load(url, callback, callbackName, charset) {
		var callbacked = false;
		if(_callbackLoadingHash[callbackName]) {
			_callbackQueueHash[callbackName] = _callbackQueueHash[callbackName] || [];
			_callbackQueueHash[callbackName].push(arguments);
			return;
		}
		_callbackLoadingHash[callbackName] = 1;
		global[callbackName] = function(data) {
			callbacked = true;
			callback(data);
			global[callbackName] = null;
		};
		function onload() {
			_clear(jsEl, callbackName, onload, onerror);
			if(!callbacked) {
				callback(null, 1);
			}
		};
		function onerror() {
			_clear(jsEl, callbackName, onload, onerror);
			callback(null, 1);
		};
		function ieOnload() {
			if(jsEl && (jsEl.readyState == 'loaded' || jsEl.readyState == 'complete')) {
				_clear(jsEl, callbackName, ieOnload);
				jsEl = null;
				if(!callbacked) {
					callback(null, 1);
				}
			}
		}
		var jsEl = document.createElement('script');
		if(jsEl.addEventListener) {
			jsEl.addEventListener('load', onload, false);
			jsEl.addEventListener('error', onerror, false);
		} else {
			jsEl.attachEvent('onreadystatechange', ieOnload);
		}
		jsEl.charset = charset;
		jsEl.type = 'text/javascript';
		jsEl.async = 'async';
		jsEl.src = url;
		jsEl = _head.insertBefore(jsEl, _head.firstChild);
	};
	
	function req(id, config, callback, errCallback) {
		var url = this._getResource(id);
		var params, callbackName, charset;
		if(callback) {
			if(url) {
				params = this._getParams(id);
				callbackName = params['callbackName'] || '_Callback';
				charset = params['charset'] || 'utf-8';
				_load(url, function(data, err) {
					if(err) {
						errCallback && errCallback(require.ERR_CODE.LOAD_ERROR, {url: url});
					} else {
						_cache[url] = data;
						callback(data);
					}
				}, callbackName, charset);
			} else {
				callback(this);
			}
		}
		return url && _cache[url] || this;
	};
	
	return {
		require: req
	};
});
