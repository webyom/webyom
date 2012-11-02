/**
 * YOM require jsonp plugin
 */
define('require-plugin/jsonp', [], function() {
	var _head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	var _callbackQueueHash = {};
	var _callbackLoadingHash = {};
	var _cache = {};
	
	function _clear(jsEl, callbackName) {
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
		window[callbackName] = function(data) {
			callbacked = true;
			callback(data);
			window[callbackName] = null;
		};
		function onload() {
			_clear(jsEl, callbackName);
			if(!callbacked) {
				callback(null, 1);
			}
		};
		function onerror() {
			_clear(jsEl, callbackName);
			callback(null, 1);
		};
		var jsEl = document.createElement('script');
		if(jsEl.addEventListener) {
			jsEl.addEventListener('load', function() {
				onload();
			}, this);
			jsEl.addEventListener('error', function() {
				onerror();
			}, this);
		} else {
			jsEl.attachEvent('onreadystatechange', function() {
				if(jsEl && (jsEl.readyState == 'loaded' || jsEl.readyState == 'complete')) {
					onload();
					jsEl = null;
				}
			}, this);
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
