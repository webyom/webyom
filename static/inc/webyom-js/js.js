/**
 * @fileoverview base of YOM framework
 * @author Gary Wang webyom@gmail.com webyom.org
 */

/*
ID LIST:
100: base
101: error
102: class
103: array
104: browser
105: cookie
106: css
107: element
108: event
109: js_loader
110: object
111: observer
112: pos
113: js
114: tmpl
115: util
116: xhr
117: string
118: console
119: transition
120: tween
121: localStorage
122: dragdrop
123: HashArray
124: InstanceManager
125: CrossDomainPoster
126: json
127: history
128: widget
128001: widget.Mask
128002: widget.Dialog
128003: widget.Tooltip
*/

/**
 * @namespace
 */
var YOM = YOM || function(sel, context) {
	return $query(sel, context);
};

YOM._ID = 100;

YOM.LIB_BASE = YOM.LIB_BASE || '/static/inc/webyom-js/';

YOM.debugMode = 0;

YOM.addModule = (function(YOM) {
	return function addModule(modName, factory, redefine) {
		var namespace = this;
		var module = namespace[modName];
		if(module && !redefine) {
			return namespace;
		}
		module = namespace[modName] = typeof factory == 'function' ? factory(YOM, namespace) : factory;
		module.addModule = YOM.addModule;
		return namespace;
	};
})(YOM);

/**
 * @namespace
 */
window.$ = window.$ || YOM;

(function() {
	var t = document.domain.split('.'), l = t.length;
	YOM.domain = t.slice(l - 2, l).join('.');
})();

function $id(id) {
	return document.getElementById(id);
};

function $query(sel, context) {
	var res;
	if(sel instanceof YOM.Element) {
		return sel;
	} else if(typeof sel == 'string') {
		if(context) {
			context = new YOM.Element(typeof context == 'string' ? (document.querySelectorAll ? document.querySelectorAll(context) : Sizzle(context)) : context);
			res = context.find(sel);
		} else {
			res = new YOM.Element(document.querySelectorAll ? document.querySelectorAll(sel) : Sizzle(sel));
		}
	} else {
		res = new YOM.Element(sel);
	}
	return res;
};

function $getClean(obj) {
	var cleaned;
	if(obj && obj.getClean) {
		cleaned = obj.getClean();
	} else if(typeof obj == 'object') {
		cleaned = {};
		for(var p in obj) {
			if(YOM.object.hasOwnProperty(obj, p)) {
				cleaned[p] = obj[p];
			}
		}
	} else {
		cleaned = obj;
	}
	return cleaned;
};

function $extend(origin, extend, check) {
	return YOM.object.extend(origin, extend, check);
};

function $bind(that, fn) {
	if(fn.bind) {
		return fn.bind(that);
	} else {
		return function() {
			return fn.apply(that, YOM.array.getArray(arguments));
		};
	}
};

function $now() {
	return +new Date();
};

function $empty() {};

var $getUniqueId = $getUniqueId || (function() {
	var _count = 0;
	
	return function getUniqueId() {
		return 'YOM_UNIQUE_ID_' + _count++;	
	};
})();
/**
 * @namespace YOM.js
 */
YOM.addModule('js', function(YOM) {
	/**
	 * Simple implementation of YOM.JsLoader. To be overwriten by core.js
	 * @namespace YOM.JsLoader
	 */
	YOM.addModule('JsLoader', function(YOM) {
		var _head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
		
		var JsLoader = function(src, opt) {
			this._src = src;
			this._charset = opt.charset;
			this._oncomplete = opt.complete || $empty;
		};
		
		JsLoader.RET = {
			SUCC: 0,
			ABORTED: -1,
			ERROR: 1	
		};
		
		JsLoader.prototype.load = function() {
			var self = this;
			var js = document.createElement('script');
			if(YOM.browser.ie) {
				_addEventListener(js, 'readystatechange', function() {
					if(js && (js.readyState == 'loaded' || js.readyState == 'complete')) {
						if(YOM.browser.v === 9) {
							js.src = '';
						}
						js.parentNode.removeChild(js);
						js = null;
						self._oncomplete.call(this, JsLoader.RET.SUCC);
					}
				});
			} else {
				_addEventListener(js, 'load', function() {
					js.parentNode.removeChild(js);
					self._oncomplete.call(this, JsLoader.RET.SUCC);
				});
				_addEventListener(js, 'error', function() {
					js.parentNode.removeChild(js);
					self._oncomplete.call(this, JsLoader.RET.ERROR);
				});
			}
			if(this._charset) {
				js.charset = this._charset;
			}
			js.type = 'text/javascript';
			js.async = 'async';
			js.src = this._src;
			_head.insertBefore(js, _head.firstChild);
		};
		
		return JsLoader;
	});
	
	var _ROOT_REGEXP_STR = ('^(?:' + location.protocol + '\\/\\/)?' + location.host + '\\/').replace('.', '\\.');
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2
	};
	
	var _srcStatusHash = {};
	var _srcLoadCbqHash = {};
	var _abortedRidHash = {};
	
	var _isArray = Array.isArray || function(obj) {
		return Object.prototype.toString.call(obj) == '[object Array]';
	};
	
	function _addEventListener(elem, type, listener) {
		if(elem.addEventListener) {
			elem.addEventListener(type, listener, false);
		} else {
			elem.attachEvent('on' + type, listener);
		}
	};
	
	function _requireLoad(src, charset, silent) {
		var status = _srcStatusHash[src];
		_srcStatusHash[src] = _STATUS.LOADING;
		new YOM.JsLoader(src, {
			complete: function(ret) {
				_srcStatusHash[src] = ret === YOM.JsLoader.RET.SUCC ? _STATUS.LOADED : status;
				var q = _srcLoadCbqHash[src];
				if(!q) {
					return;
				}
				while(q.length) {
					q.shift()(ret);
				}
				delete _srcLoadCbqHash[src];
			},
			charset: charset,
			silent: silent
		}).load();
	};
	
	function _getSrc(src) {
		if(typeof src == 'string') {
			return src.replace(new RegExp(_ROOT_REGEXP_STR, 'i'), '/');
		} else {
			return src;
		}
	};
	
	function _require(isAsync, rid, srcs, cb, charset, silent) {
		_checkRequireList();
		function _onComplete(ret) {
			if(_abortedRidHash[rid]) {
				return;
			}
			if(ret === 0) {
				_checkRequireList();
			} else {
				cb(ret);
			}
		};
		function _checkRequireList() {
			if(!srcs) {
				return;
			}
			var src;
			var srcCharset;
			var isSrcArray;
			for(var i = 0; i < srcs.length; i++) {
				src = _getSrc(srcs[i]);
				srcCharset = charset;
				isSrcArray = _isArray(src);
				if(src && typeof src == 'object' && !isSrcArray) {
					srcCharset = src.charset;
					src = src.src;
				}
				if(!src ||
				typeof src != 'string' && !isSrcArray ||
				isSrcArray && !src.length ||
				_srcStatusHash[src] == _STATUS.LOADED) {
					srcs.splice(i, 1);
					i--;
					continue;
				}
				if(isSrcArray) {
					if(src[0] === true) {
						_require(true, rid, src, _onComplete, charset, silent);
					} else {
						_require(false, rid, src, _onComplete, charset, silent);
					}
				} else {
					_srcLoadCbqHash[src] = _srcLoadCbqHash[src] || [];
					_srcLoadCbqHash[src].push(_onComplete);
					if(_srcStatusHash[src] != _STATUS.LOADING) {
						_requireLoad(src, srcCharset, silent);
					}
				}
				if(!isAsync) {
					break;
				}
			}
			if(!srcs.length) {
				srcs = null;//avoid mutilple callback in async mode
				cb(0);
			}
		}
	};
	
	function require(srcs, cb, opt) {
		var rid, bind, charset, silent;
		if(!_isArray(srcs)) {
			srcs = [srcs];
		}
		opt = opt || {};
		bind = opt.bind;
		charset = opt.charset;
		silent = opt.silent;
		rid = $getUniqueId();
		if(srcs[0] === true) {
			_require(true, rid, srcs, function(ret) {
				cb && cb.call(bind, ret);
			}, charset, silent);
		} else {
			_require(false, rid, srcs, function(ret) {
				cb && cb.call(bind, ret);
			}, charset, silent);
		}
		return rid;
	};
	
	function preload(srcs, opt) {
		opt = opt || {};
		if(typeof opt.silent == 'undefined') {
			opt.silent = 1;
		}
		return require(srcs, null, opt);
	};
	
	function unload(srcs) {
		var i, src;
		if(!_isArray(srcs)) {
			srcs = [srcs];
		}
		for(i = 0, l = srcs.length; i < l; i++) {
			src = srcs[i];
			if(_srcStatusHash[src] != _STATUS.LOADED) {
				continue;
			}
			_srcStatusHash[src] = _STATUS.INIT;
		}
	};
	
	function abort(rid) {
		_abortedRidHash[rid] = 1;
	};
	
	return {
		_ID: 113,
		require: require,
		preload: preload,
		unload: unload,
		abort: abort
	};
});
/**
 * @namespace YOM.browser
 */
YOM.addModule('browser', function(YOM) {
	var _ua = navigator.userAgent.toLowerCase();
	
	return {
		_ID: 104,
		v: +(_ua.match(/(?:version|firefox|chrome|safari|opera|msie)[\/: ]([\d]+)/) || [0, 0])[1],
		ie: (/msie/).test(_ua) && !(/opera/).test(_ua),
		opera: (/opera/).test(_ua),
		firefox: (/firefox/).test(_ua),
		chrome: (/chrome/).test(_ua),
		safari: (/safari/).test(_ua) && !(/chrome/).test(_ua) && !(/android/).test(_ua),
		iphone: (/iphone|ipod/).test(_ua),
		ipad: (/ipad/).test(_ua),
		android: (/android/).test(_ua),
		
		isQuirksMode: function() {
			return document.compatMode != 'CSS1Compat';
		}
	};
});
