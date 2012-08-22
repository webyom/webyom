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
 * @namespace YOM.localStorage
 */
YOM.addModule('localStorage', function(YOM) {
	var _DB_NAME = 'WEBYOM_LOCAL_STORAGE';
	var _PROXY = '/static/inc/webyom-js/local_storage_proxy.html';
	var _COOKIE_DOMAIN = 'webyom.org';
	var _COOKIE_PATH = '/static/inc/webyom-js/';
	
	var _db = {
		name: 'default',
		noProxy: true,
		db: {},

		set: function(key, val) {
			this.db[key] = val;
		},

		get: function(key) {
			return this.db[key];
		},

		remove: function(key) {
			delete this.db[key];
		},

		clear: function() {
			this.db = {};
		}
	};
	
	var _dbs = [
		{
			name: 'localStorage',
			isSupported: !!window.localStorage,
			
			set: function(key, val) {
				localStorage.setItem(key, val);
			},
			
			get: function(key) {
				return localStorage.getItem(key);
			},

			remove: function(key) {
				localStorage.removeItem(key);
			},

			clear: function() {
				localStorage.clear();
			},

			init: function() {}
		},

		{
			name: 'globalStorage',
			isSupported: !!window.globalStorage,
			db: null,

			set: function(key, val) {
				try {
					this.db.setItem(key, val);
					return 1;
				} catch(e) {
					return 0;
				}
			},
			
			get: function(key) {
				var res;
				try {
					res = this.db.getItem(key);
					res = res && res.value || res;
				} catch(e) {}
				return res;
			},

			remove: function(key) {
				try {
					db.removeItem(key);
				} catch(e) {}
			},

			clear: function() {
				try {
					for(var key in this.db) {
						this.db.removeItem(key);
					}
				} catch(e) {}
			},

			init: function() {
				this.db = globalStorage[document.domain];
			}
		},

		{
			name: 'userData',
			isSupported: !!window.ActiveXObject,
			db: null,
			
			set: function(key, val) {
				var expires = this.db.expires.toString();
				if(expires !== '' && expires.indexOf('1983') !== -1) {//fix for clear
					this.db.expires = new Date(+new Date() + 365 * 86400000).toUTCString();
				}
				try {
					this.db.setAttribute(key, val);
					this.db.save(_DB_NAME);
					return 1;
				} catch(e) {
					return 0;
				}
			},
			
			get: function(key) {
				this.db.load(_DB_NAME);
				return this.db.getAttribute(key);
			},

			remove: function(key) {
				this.db.removeAttribute(key);
				this.db.save(_DB_NAME);
			},

			clear: function() {
				this.db.expires = new Date(417628800000).toUTCString();//Sun, 27 Mar 1983 16:00:00 GMT
				this.db.save(_DB_NAME);
			},

			init: function() {
				this.db = document.documentElement || document.body;
				this.db.addBehavior('#default#userdata');
				this.db.load(_DB_NAME);
			}
		},
		
		{
			name: 'cookie',
			isSupported: typeof document.cookie == 'string',
			
			set: function(key, val, life) {
				var expire;
				life = life || 24 * 30;
				expire = new Date();
				expire.setTime(expire.getTime() + 3600000 * life);
				document.cookie = (key + '=' + val + '; ') + ('expires=' + expire.toGMTString() + '; ') + ('path=' + _COOKIE_PATH + '; ') + ('domain=' + _COOKIE_DOMAIN + ';');
			},
			
			get: function(key) {
				var r = new RegExp('(?:^|;\\s*)' + key + '=([^;]*)'), m = document.cookie.match(r);
				return m && m[1];
			},

			remove: function(key) {
				this.set(key, '', -24);
			},

			clear: function() {
				var m = document.cookie.match(/\w+=[^;]*/g);
				if(m) {
					for(var i = 0, l = m.length; i < l; i++) {
						this.remove(m[i].split('=')[0]);
					}
				}
			},

			init: function() {}
		}
	];

	for(i = 0; i < _dbs.length; i++) {
		if(_dbs[i].isSupported) {
			_db = _dbs[i];
			_db.init();
			break;
		}
	}

	var _facade = {
		set: function(opts) {
			var res = _db.set(opts.key, opts.val, opts.life);
			if(opts.cb) {
				return opts.cb(res);
			} else {
				return res;
			}
		},

		get: function(opts) {
			var res;
			var keys = opts.key.split(' ');
			if(keys.length > 1) {
				res = {};
				YOM.object.each(keys, function(key) {
					res[key] = _db.get(key);
				});
			} else {
				res = _db.get(keys[0]);
			}
			if(opts.cb) {
				return opts.cb(res);
			} else {
				return res;
			}
		},

		remove: function(opts) {
			var keys = opts.key.split(' ');
			if(keys.length > 1) {
				YOM.object.each(keys, function(key) {
					_db.remove(key);
				});
			} else {
				_db.remove(keys[0]);
			}
			if(opts.cb) {
				opts.cb();
			}
		},

		clear: function(opts) {
			_db.clear();
			if(opts.cb) {
				opts.cb();
			}
		}
	};

	function _do(action, proxy, opts) {
		var frameId = 'yomLocalStorageProxy';
		var frame;
		opts = opts || {};
		if(proxy !== null && _db.name == 'cookie') {
			proxy = proxy || _PROXY;
		}
		if(proxy && !_db.noProxy) {
			frame = $id(frameId);
			if(frame) {
				frame._queue.push([action, opts]);
				if(frame._loaded) {
					frame.contentWindow.YOM.localStorage.proxyPull();
				}
			} else {
				proxy = typeof proxy == 'object' && proxy.src || _PROXY;
				frame = document.createElement('iframe');
				frame.id = frameId;
				frame.src = proxy;
				frame.style.display = 'none';
				frame._queue = [[action, opts]];
				YOM.Event.addListener(frame, 'load', function() {
					if(!frame._loaded) {
						YOM.object.each(frame._queue, function(p) {
							if(p[1] && p[1].cb) {
								setTimeout(function() {
									p[1].cb(null, -1);
								}, 0);
							}
						});
					}
				});
				frame = document.body.appendChild(frame);
			}
			return undefined;
		}
		return _facade[action](opts);
	};

	function _getWithExpires(val, key, proxy) {
		var rmKeys = [];
		if(typeof val == 'object') {
			YOM.object.each(val, function(v, k) {
				val[k] = getOne(v, k);
			});
		} else {
			val = getOne(val, key);
		}
		if(rmKeys.length) {
			remove(rmKeys.join(' '), {proxy: proxy});
		}
		function getOne(val, key) {
			var m;
			if(val) {
				m = val.match(/(.*)\[expires=(\d+)\]$/);
				if(m) {
					if(m[2] < new Date().getTime()) {
						val = undefined;
						rmKeys.push(key);
					} else {
						val = m[1];
					}
				}
			} else {
				val = undefined;
			}
			return val;
		};
		return val;
	};

	function set(key, val, opts) {
		opts = opts || {};
		if(opts.life && _db.name != 'cookie') {//hour
			val = val + ('[expires=' + (new Date().getTime() + opts.life * 3600000) + ']');
		}
		return _do('set', opts.proxy, {key: key, val: val, cb: opts.callback, life: opts.life});
	};

	function get(key, opts) {
		var cb, res;
		opts = opts || {};
		if(opts.callback) {
			cb = function(res) {
				opts.callback(_getWithExpires(res, key, opts.proxy));
			};
			return _do('get', opts.proxy, {key: key, cb: cb});
		} else {
			res = _do('get', opts.proxy, {key: key});
			return _getWithExpires(res, key, opts.proxy);
		}
	};

	function remove(key, opts) {
		opts = opts || {};
		return _do('remove', opts.proxy, {key: key});
	};

	function clear(opts) {
		opts = opts || {};
		return _do('clear', opts.proxy, {});
	};

	return {
		_ID: 121,
		_db: _db,
		_do: _do,
		set: set,
		get: get,
		remove: remove,
		clear: clear
	};
});
