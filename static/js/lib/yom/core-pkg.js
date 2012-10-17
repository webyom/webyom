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
define('yom/config', [], function() {
	var t = document.domain.split('.'), l = t.length;
	return {
		debugMode: 0,
		domain: t.slice(l - 2, l).join('.')
	};
});
/**
 * @class YOM.Error
 */
/*
Code Description:
YOM.Class
	10101: constructor - arguments length error
YOM.JsLoader
	10201: load fail
	10202: callback fail
YOM.Xhr
	10401: onerror
*/
define('yom/error', [], function() {
	var YomError = function(code, opt) {
		if(typeof opt == 'string') {
			opt = {message: opt};
		}
		this.opt = opt || {};
		if(code instanceof YomError) {
			this.name = code.name;
			this.code = code.code;
			this.message = code.message;
		} else if(code instanceof Error) {
			this.name = code.name;
			this.code = 0;
			this.message = code.message;
		} else {
			this.name = this.opt.name || 'YOM Error';
			this.code = +code;
			this.message = this.opt.message || '';
		}
	};
	
	YomError._ID = 101;
	
	YomError.getCode = function(id, code) {
		if(code < 10) {
			code = '0' + code;
		}
		return parseInt(id + '' + code);
	};
	
	YomError.prototype.toString = function() {
		return this.name + ': ' + this.message + (this.code ? ' [' + this.code + ']' : '');
	};
	
	return YomError;
});
/**
 * @namespace YOM.browser
 */
define('yom/browser', [], function() {
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
/**
 * @namespace YOM.string
 */
define('yom/string', [], {
	_ID: 117,
	
	getByteLength: function(str) {
		return str.replace(/[^\x00-\xff]/g, 'xx').length;
	},
	
	headByByte: function(str, len, postFix) {
		if(this.getByteLength(str) <= len) {
			return str;
		}
		postFix = postFix || '';
		var l;
		if(postFix) {
			l = len = len - this.getByteLength(postFix);
		} else {
			l = len;
		}
		do {
			str = str.slice(0, l--);
		} while(this.getByteLength(str) > len);
		return str + postFix;
	},
	
	encodeHtml: function(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\x60/g, '&#96;').replace(/\x27/g, '&#39;').replace(/\x22/g, '&quot;');
	},
	
	decodeHtml: function(str) {
		return (str + '').replace(/&quot;/g, '\x22').replace(/&#0*39;/g, '\x27').replace(/&#0*96;/g, '\x60').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
	},
	
	trim: function(str) {
		if(str.trim) {
			return str.trim();
		} else {
			return str.replace(/^\s+|\s+$/, '');
		}
	},
	
	toCamelCase: function(str) {
		return str.replace(/[-_]+(\w)([^-_]*)/g, function($1, $2, $3) {return $2.toUpperCase() + $3.toLowerCase();});
	},
	
	toJoinCase: function(str, joiner) {
		joiner = joiner || '-';
		return str.replace(/[A-Z]/g, function($1) {return joiner + $1.toLowerCase();}).replace(new RegExp("^" + joiner), '');
	}
});
/**
 * @namespace YOM.object
 */
define('yom/object', ['require'], function(require) {
	return {
		_ID: 110,
		
		PRIVATE_PROPERTY: {/*Do not assign this value to your reference in your code!*/},
			
		toString: function(obj) {
			return Object.prototype.toString.call(obj);
		},
		
		isArray: function(obj) {
			var YOM = {
				'array': require('yom/array')
			};
			return YOM.array.isArray(obj);
		},
		
		isFunction: function(obj) {
			return typeof obj == 'function';
		},
		
		hasOwnProperty: function(obj, prop) {
			return Object.prototype.hasOwnProperty.call(obj, prop);
		},
		
		each: function(obj, fn, bind) {
			var YOM = {
				'array': require('yom/array')
			};
			var val;
			if(YOM.array.isArray(obj)) {
				YOM.array.each(obj, fn, bind);
			} else {
				for(var p in obj) {
					if(this.hasOwnProperty(obj, p)) {
						try {
							val = obj[p];
						} catch(e) {
							val = this.PRIVATE_PROPERTY;
						}
						if(fn.call(bind || obj, val, p, obj) === false) {
							break;
						}
					}
				}
			}
		},
		
		extend: function(origin, extend, check) {
			origin = origin || {};
			for(var p in extend) {
				if(this.hasOwnProperty(extend, p) && (!check || typeof origin[p] == 'undefined')) {
					origin[p] = extend[p];
				}
			}
			return origin;
		},
		
		bind: function(obj, fn) {
			return $bind(obj, fn);
		},

		clone: function(obj, deep) {
			var YOM = {
				'array': require('yom/array')
			};
			if(typeof obj == 'object') {
				var res = YOM.array.isArray(obj) ? [] : {};
				for(var i in obj) {
					res[i] = deep ? this.clone(obj[i], deep) : obj[i];
				}
				return res;
			}
			return obj;
		},
		
		toQueryString: function(obj) {
			var res = [];
			this.each(obj, function(val, key) {
				var type = typeof val;
				if(!(type == 'string' || type == 'number')) {
					return;
				}
				res.push(key + '=' + encodeURIComponent(val));
			});
			return res.join('&');
		},
		
		fromQueryString: function(str) {
			var res = {};
			var items = str.split('&');
			this.each(items, function(item) {
				item = item.split('=');
				res[item[0]] = decodeURIComponent(item[1]);
			});
			return res;
		}
	};
});
/**
 * @namespace YOM.array
 */
define('yom/array', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object')
	};
	
	return {
		_ID: 103,
		
		isArray: Array.isArray || function(obj) {
			return YOM.object.toString(obj) == '[object Array]';
		},
	
		each: function(arr, fn, bind) {
			for(var i = 0, l = arr.length; i < l; i++) {
				if(fn.call(bind || arr, arr[i], i, arr) === false) {
					break;
				}
			}
		},
		
		remove: function(arr, item) {
			var isFn = typeof item == 'function';
			var flag;
			for(var i = arr.length - 1; i >= 0; i--) {
				flag = isFn && item(arr[i], i, arr);
				if(arr[i] == item || flag) {
					arr.splice(i, 1);
					if(flag === -1) {
						break;
					}
				}
			}
			return arr;
		},
		
		getArray: function(obj) {
			return Array.prototype.slice.call(obj);
		},
		
		filter: function(arr, fn) {
			if(typeof arr.filter == 'function') {
				return arr.filter(fn);
			} else {
				var res = [];
				YOM.object.each(arr, function(item, i) {
					if(fn(item, i, arr)) {
						res.push(item);
					}
				});
				return res;
			}
		}
	};
});
/**
 * @class YOM.Chunker
 */
define('yom/chunker', ['require'], function(require) {
	var YOM = {
		'array': require('yom/array')
	};
	
	var Chunker = function(processer, opt) {
		opt = opt || {};
		this._bind = opt.bind;
		this._duration = opt.duration >= 0 ?  opt.duration : 50;
		this._interval = opt.interval || 25;
		this._interval2 = opt.interval2;
		this._batch = opt.batch;
		this._data = [];
		this._processer = processer || function() {};
		this._complete = opt.complete;
		this._toRef = null;
	};
	
	Chunker.prototype = {
		push: function(o, flatten) {
			if(flatten && YOM.array.isArray(o)) {
				this._data = this._data.concat(o);
			} else {
				this._data.push(o);
			}
			return this;
		},
		
		process: function() {
			var self = this;
			if(self._toRef) {
				return this;
			}
			var aStartTime = new Date();
			var total = 0;
			self._toRef = setTimeout(function() {
				var item;
				var count = 0;
				var bStartTime = new Date();
				if(self._data.length && !aStartTime) {
					aStartTime = bStartTime;
				}
				while(self._data.length && (new Date() - bStartTime < self._duration || self._duration === 0 && count === 0)) {
					item = self._batch ? self._data.splice(0, self._batch) : self._data.shift();
					if(YOM.array.isArray(item)) {
						self._processer.apply(self._bind, item);
					} else {
						self._processer.call(self._bind, item);
					}
					count++;
					total++;
				}
				if(self._data.length) {
					self._toRef = setTimeout(arguments.callee, self._interval);
				} else {
					if(self._interval2) {
						self._toRef = setTimeout(arguments.callee, self._interval2);
					} else {
						self._toRef = null;
					}
					if(self._complete) {
						self._complete(new Date() - aStartTime, total);
					}
					aStartTime = null;
					total = 0;
				}
			}, self._interval);
			return this;
		},
		
		constructor: Chunker
	};
	
	return Chunker;
});
/**
 * @class YOM.Class
 */
define('yom/class', ['require'], function(require) {
	var YOM = {
		'Error': require('yom/error'),
		'browser': require('yom/browser'),
		'object': require('yom/object'),
		'array': require('yom/array')
	};
	
	var Class = function() {};

	Class._ID = 102;
	
	Class.extend = function(subClass, superClass) {
		if(arguments.length < 2) {
			throw new YOM.Error(YOM.Error.getCode(YOM.Class._ID, 1));
		}
		var F = function() {};
		F.prototype = superClass.prototype;
		subClass.prototype = new F();
		subClass.prototype.constructor = subClass;
		subClass.superClass = superClass.prototype;
		if(superClass.prototype.constructor == Object.prototype.constructor) {
			superClass.prototype.constructor = superClass;
		}
		return subClass;
	};
	
	Class.genericize = function(obj, props, opt) {
		opt = opt || {};
		if(!YOM.array.isArray(props)) {
			props = [props];
		}
		YOM.object.each(props, function(prop) {
			if((!opt.check || !obj[prop]) && YOM.object.isFunction(obj.prototype[prop])) {
				obj[prop] = function(){
					var args = YOM.array.getArray(arguments);
					return obj.prototype[prop].apply(opt.bind || args.shift(), args);
				};
			}
		});
	};
	
	return Class;
});

/**
 * @class YOM.HashArray
 */
define('yom/hash-array', [], function() {
	var HashArray = function() {
		this._items = [];
		this._k2i = {};
		this._i2k = [];
		for(var i = 0, l = arguments.length; i < l; i += 2) {
			if(this._isValidKey(arguments[i])) {
				this._items.push(arguments[i + 1]);
				this._i2k.push(arguments[i]);
				this._k2i[arguments[i]] = this.size() - 1;
			}
		}
	};
	
	HashArray._ID = 123;
	
	HashArray.prototype = {
		_isValidKey: function(key) {
			return key && typeof key == 'string';
		},
		
		size: function() {
			return this._items.length;	
		},
		
		get: function(key) {
			if(typeof key == 'string') {
				return this._items[this._k2i[key]];
			} else {
				return this._items[key];
			}
		},
		
		set: function(key, val) {
			if(this._isValidKey(key)) {
				if(this._k2i[key] >= 0) {
					this._items[this._k2i[key]] = val;
				}
			} else if(typeof key == 'number') {
				if(key < this._items.length) {
					this._items[key] = val;
				}
			}
		},
		
		remove: function(key) {
			if(this._isValidKey(key)) {
				if(this._k2i[key] >= 0) {
					return this.splice(this._k2i[key], 1);
				}
			} else if(typeof key == 'number') {
				if(key < this._items.length) {
					return this.splice(key, 1);
				}
			}
			return null;
		},
		
		hasKey: function(key) {
			return this._k2i[key] >= 0;
		},
		
		hasValue: function(val) {
			var has = false;
			this.each(function(v) {
				if(val === v) {
					has = true;
					return false;
				}
				return true;
			});
			return has;
		},
		
		each: function(cb) {
			for(var i = 0, l = this._items.length; i < l; i++) {
				if(cb(this._items[i], i, this._i2k[i]) ===  false) {
					break;
				}
			}
		},
		
		push: function(key, val) {
			if(!this._isValidKey(key)) {
				return;
			}
			var i = this._items.length;
			this._items.push(val);
			this._i2k.push(key);
			this._k2i[key] = i;
		},
		
		pop: function() {
			var dk = this._i2k.pop();
			var dv = this._items.pop();
			delete this._k2i[dk];
			return dk ? new HashArray(dk, dv) : undefined;
		},
		
		unshift: function(key, val) {
			if(!this._isValidKey(key)) {
				return;
			}
			this._items.unshift(val);
			this._i2k.unshift(key);
			for(var k in this._k2i) {
				if(this._k2i.hasOwnProperty(k)) {
					this._k2i[k]++;
				}
			}
			this._k2i[key] = 0;
		},
		
		shift: function() {
			var dk = this._i2k.shift();
			var dv = this._items.shift();
			for(var k in this._k2i) {
				if(this._k2i.hasOwnProperty(k)) {
					if(dk == k) {
						delete this._k2i[k];
					} else {
						this._k2i[k]--;
					}
				}
			}
			return dk ? new HashArray(dk, dv) : undefined;
		},
		
		slice: function(s, e) {
			var ks, vs, res;
			ks = this._i2k.slice(s, e);
			vs = this._items.slice(s, e);
			res = new HashArray();
			for(i = 0, l = ks.length; i < l; i++) {
				res.push(ks[i], vs[i]);
			}
			return res;
		},
		
		splice: function(s, c) {
			var dks, dvs, i, l, res;
			var ks = [], vs = [];
			for(i = 2, l = arguments.length; i < l; i += 2) {
				if(this._isValidKey(arguments[i])) {
					ks.push(arguments[i]);
					vs.push(arguments[i + 1]);
				}
			}
			dks = Array.prototype.splice.apply(this._i2k, [s, c].concat(ks));
			dvs = Array.prototype.splice.apply(this._items, [s, c].concat(vs));
			res = new HashArray();
			for(i = 0, l = dks.length; i < l; i++) {
				if(this._k2i.hasOwnProperty(dks[i])) {
					delete this._k2i[dks[i]];
				}
				res.push(dks[i], dvs[i]);
			}
			for(i = s, l = this._i2k.length; i < l; i++) {
				this._k2i[this._i2k[i]] = i;
			}
			return res;
		},
		
		concat: function(ha) {
			var res, i, l;
			var ks = [], vs = [];
			if(!(ha instanceof HashArray)) {
				return this;
			}
			res = new HashArray();
			for(i = 0, l = this.size(); i < l; i++) {
				res.push(this._i2k[i], this._items[i]);
			}
			for(i = 0, l = ha.size(); i < l; i++) {
				res.push(ha._i2k[i], ha._items[i]);
			}
			return res;
		},
		
		join: function(s) {
			return this._items.join(s);
		},
		
		constructor: HashArray
	};
	
	return HashArray;
});
/**
 * @class YOM.InstanceManager
 */
define('yom/instance-manager', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object'),
		'array': require('yom/array')
	};
		
	var InstanceManager = function() {
		this._init();
	};
	
	InstanceManager._ID = 124;
	
	InstanceManager.prototype = {
		_init: function() {
			this._pool = [];
		},
		
		add: function(inst) {
			var id = $getUniqueId();
			this._pool.push({id: id, inst: inst});
			return id;
		},
		
		get: function(id) {
			var res;
			YOM.object.each(this._pool, function(item) {
				if(item.id == id) {
					res = item.inst;
					return false;
				}
				return true;
			});
			return res;
		},
		
		remove: function(id) {
			YOM.array.remove(this._pool, function(item) {
				if(item.id == id) {
					return -1;
				}
				return 0;
			});
		},
		
		count: function() {
			return this._pool.length;
		},
		
		each: function(cb, bind) {
			YOM.object.each(this._pool, function(item) {
				if(item) {
					return cb.call(bind, item.inst, item.id);
				}
				return true;
			});
		},
		
		clear: function() {
			this._init();
		},
		
		constructor: InstanceManager
	};
	
	return InstanceManager;
});
// This source code is free for use in the public domain.
// NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

// http://code.google.com/p/json-sans-eval/

/**
 * Parses a string of well-formed JSON text.
 *
 * If the input is not well-formed, then behavior is undefined, but it is
 * deterministic and is guaranteed not to modify any object other than its
 * return value.
 *
 * This does not use `eval` so is less likely to have obscure security bugs than
 * json2.js.
 * It is optimized for speed, so is much faster than json_parse.js.
 *
 * This library should be used whenever security is a concern (when JSON may
 * come from an untrusted source), speed is a concern, and erroring on malformed
 * JSON is *not* a concern.
 *
 *                      Pros                   Cons
 *                    +-----------------------+-----------------------+
 * json_sans_eval.js  | Fast, secure          | Not validating        |
 *                    +-----------------------+-----------------------+
 * json_parse.js      | Validating, secure    | Slow                  |
 *                    +-----------------------+-----------------------+
 * json2.js           | Fast, some validation | Potentially insecure  |
 *                    +-----------------------+-----------------------+
 *
 * json2.js is very fast, but potentially insecure since it calls `eval` to
 * parse JSON data, so an attacker might be able to supply strange JS that
 * looks like JSON, but that executes arbitrary javascript.
 * If you do have to use json2.js with untrusted data, make sure you keep
 * your version of json2.js up to date so that you get patches as they're
 * released.
 *
 * @param {string} json per RFC 4627
 * @param {function (this:Object, string, *):*} opt_reviver optional function
 *     that reworks JSON objects post-parse per Chapter 15.12 of EcmaScript3.1.
 *     If supplied, the function is called with a string key, and a value.
 *     The value is the property of 'this'.  The reviver should return
 *     the value to use in its place.  So if dates were serialized as
 *     {@code { "type": "Date", "time": 1234 }}, then a reviver might look like
 *     {@code
 *     function (key, value) {
 *       if (value && typeof value === 'object' && 'Date' === value.type) {
 *         return new Date(value.time);
 *       } else {
 *         return value;
 *       }
 *     }}.
 *     If the reviver returns {@code undefined} then the property named by key
 *     will be deleted from its container.
 *     {@code this} is bound to the object containing the specified property.
 * @return {Object|Array}
 * @author Mike Samuel <mikesamuel@gmail.com>
 */
define('yom/json-sans-eval', [], function() {
var jsonParse = (function () {
  var number
      = '(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)';
  var oneChar = '(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]'
      + '|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';
  var string = '(?:\"' + oneChar + '*\")';

  // Will match a value in a well-formed JSON file.
  // If the input is not well-formed, may match strangely, but not in an unsafe
  // way.
  // Since this only matches value tokens, it does not match whitespace, colons,
  // or commas.
  var jsonToken = new RegExp(
      '(?:false|true|null|[\\{\\}\\[\\]]'
      + '|' + number
      + '|' + string
      + ')', 'g');

  // Matches escape sequences in a string literal
  var escapeSequence = new RegExp('\\\\(?:([^u])|u(.{4}))', 'g');

  // Decodes escape sequences in object literals
  var escapes = {
    '"': '"',
    '/': '/',
    '\\': '\\',
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t'
  };
  function unescapeOne(_, ch, hex) {
    return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16));
  }

  // A non-falsy value that coerces to the empty string when used as a key.
  var EMPTY_STRING = new String('');
  var SLASH = '\\';

  // Constructor to use based on an open token.
  var firstTokenCtors = { '{': Object, '[': Array };

  var hop = Object.hasOwnProperty;

  return function (json, opt_reviver) {
    // Split into tokens
    var toks = json.match(jsonToken);
    // Construct the object to return
    var result;
    var tok = toks[0];
    var topLevelPrimitive = false;
    if ('{' === tok) {
      result = {};
    } else if ('[' === tok) {
      result = [];
    } else {
      // The RFC only allows arrays or objects at the top level, but the JSON.parse
      // defined by the EcmaScript 5 draft does allow strings, booleans, numbers, and null
      // at the top level.
      result = [];
      topLevelPrimitive = true;
    }

    // If undefined, the key in an object key/value record to use for the next
    // value parsed.
    var key;
    // Loop over remaining tokens maintaining a stack of uncompleted objects and
    // arrays.
    var stack = [result];
    for (var i = 1 - topLevelPrimitive, n = toks.length; i < n; ++i) {
      tok = toks[i];

      var cont;
      switch (tok.charCodeAt(0)) {
        default:  // sign or digit
          cont = stack[0];
          cont[key || cont.length] = +(tok);
          key = void 0;
          break;
        case 0x22:  // '"'
          tok = tok.substring(1, tok.length - 1);
          if (tok.indexOf(SLASH) !== -1) {
            tok = tok.replace(escapeSequence, unescapeOne);
          }
          cont = stack[0];
          if (!key) {
            if (cont instanceof Array) {
              key = cont.length;
            } else {
              key = tok || EMPTY_STRING;  // Use as key for next value seen.
              break;
            }
          }
          cont[key] = tok;
          key = void 0;
          break;
        case 0x5b:  // '['
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = []);
          key = void 0;
          break;
        case 0x5d:  // ']'
          stack.shift();
          break;
        case 0x66:  // 'f'
          cont = stack[0];
          cont[key || cont.length] = false;
          key = void 0;
          break;
        case 0x6e:  // 'n'
          cont = stack[0];
          cont[key || cont.length] = null;
          key = void 0;
          break;
        case 0x74:  // 't'
          cont = stack[0];
          cont[key || cont.length] = true;
          key = void 0;
          break;
        case 0x7b:  // '{'
          cont = stack[0];
          stack.unshift(cont[key || cont.length] = {});
          key = void 0;
          break;
        case 0x7d:  // '}'
          stack.shift();
          break;
      }
    }
    // Fail if we've got an uncompleted object.
    if (topLevelPrimitive) {
      if (stack.length !== 1) { throw new Error(); }
      result = result[0];
    } else {
      if (stack.length) { throw new Error(); }
    }

    if (opt_reviver) {
      // Based on walk as implemented in http://www.json.org/json2.js
      var walk = function (holder, key) {
        var value = holder[key];
        if (value && typeof value === 'object') {
          var toDelete = null;
          for (var k in value) {
            if (hop.call(value, k) && value !== holder) {
              // Recurse to properties first.  This has the effect of causing
              // the reviver to be called on the object graph depth-first.

              // Since 'this' is bound to the holder of the property, the
              // reviver can access sibling properties of k including ones
              // that have not yet been revived.

              // The value returned by the reviver is used in place of the
              // current value of property k.
              // If it returns undefined then the property is deleted.
              var v = walk(value, k);
              if (v !== void 0) {
                value[k] = v;
              } else {
                // Deleting properties inside the loop has vaguely defined
                // semantics in ES3 and ES3.1.
                if (!toDelete) { toDelete = []; }
                toDelete.push(k);
              }
            }
          }
          if (toDelete) {
            for (var i = toDelete.length; --i >= 0;) {
              delete value[toDelete[i]];
            }
          }
        }
        return opt_reviver.call(holder, key, value);
      };
      result = walk({ '': result }, '');
    }

    return result;
  };
})();

return jsonParse;
});
/**
 * @namespace YOM.json
 */
define('yom/json', ['require'], function(require) {
	var YOM = {
		'Error': require('yom/error'),
		'object': require('yom/object'),
		'array': require('yom/array'),
		'jsonParse': require('yom/json-sans-eval')
	};
	
	var _ID = 126;
	
	var _escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
	var _meta = {
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"' : '\\"',
		'\\': '\\\\'
	};
	
	function _quote(str) {
		_escapable.lastIndex = 0;
		return _escapable.test(str) ? '"' + str.replace(_escapable, function(c) {
			return _meta[c] || '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
		}) + '"' : '"' + str + '"';
	};
	
	return {
		parse: function(str) {
			return YOM.jsonParse(str);
		},
		
		stringify: function(obj, prettify, objIndentLevel) {
			var self = this;
			var res, tmp, indent, newLine;
			if(prettify) {
				objIndentLevel = objIndentLevel || 1;
				newLine = '\n';
			} else {
				objIndentLevel = 0;
				newLine = '';
			}
			switch(typeof obj) {
			case 'string':
				res = _quote(obj);
				break;
			case 'boolean':
				res = obj.toString();
				break;
			case 'number':
				if(isNaN(obj)) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1), 'NaN not supported.');
				} else if(!isFinite(obj)) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 2), 'Infinite number not supported.');
				} else {
					res = obj.toString();
				}
				break;
			case 'object':
				if(!obj) {
					res = 'null';
					break;
				}
				tmp = [];
				if(obj.__YOM_JSON_STRINGIFY_MARKED__) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1), 'YOM.json.stringify can not deal with circular reference.');
				}
				obj.__YOM_JSON_STRINGIFY_MARKED__ = 1;
				if(YOM.array.isArray(obj)) {
					YOM.object.each(obj, function(val) {
						var s = self.stringify(val, prettify, objIndentLevel);
						s && tmp.push(s);
					});
					res = '[' + tmp.join(', ') + ']';
				} else {
					indent = [];
					for(var i = 0; i < objIndentLevel; i++) {
						indent.push('    ');
					}
					YOM.object.each(obj, function(val, key) {
						if(key == '__YOM_JSON_STRINGIFY_MARKED__' || val === YOM.object.PRIVATE_PROPERTY) {
							return;
						}
						if(YOM.object.hasOwnProperty(obj, key)) {
							var s = self.stringify(val, prettify, objIndentLevel + 1);
							s && tmp.push(indent.join('') + _quote(key) + ': ' + s);
						}
					});
					indent.pop();
					if(tmp.length) {
						res = '{' + newLine + tmp.join(', ' + newLine) + newLine + indent.join('') + '}';
					} else {
						res = '{}';
					}
				}
				delete obj.__YOM_JSON_STRINGIFY_MARKED__;
				break;
			default:
				throw new YOM.Error(YOM.Error.getCode(_ID, 3), typeof obj + ' type not supported.');
			}
			return res;
		}
	};
});
/**
 * @class YOM.Element
 */
define('yom/element', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'string': require('yom/string'),
		'object': require('yom/object'),
		'array': require('yom/array')
	};
	
	function _isElementNode(el) {
		return el && (el.nodeType === 1 || el.nodeType === 9);
	};
	
	function _hasClass(el, className) {
		return new RegExp('(?:^|\\s+)' + className + '(?:$|\\s+)').test(el.className);
	};
	
	function Item(el) {
		this._el = el;
		this._styleStorage = {};
	};
	
	$extend(Item.prototype, {
		get: function() {
			return this._el;
		},
		
		setStyle: function(name, value) {
			var el = this.get();
			var computer = el.ownerDocument.defaultView;
			computer = computer && computer.getComputedStyle;
			if(typeof name == 'object') {
				YOM.object.each(name, function(val, key) {
					new Item(el).setStyle(key, val);
				});
			} else {
				if(!name) {
					return this;
				}
				name = YOM.string.toCamelCase(name);
				switch(name) {
				case 'opacity':
					if(computer) {
						el.style[name] = value;
					} else {
						if(value == 1) {
							el.style.filter = '';
						} else {
							el.style.filter = 'alpha(opacity=' + parseInt(value * 100) + ')';
						}
					}
					break;
				default:
					el.style[name] = value;
				}
			}
			return this;
		},
		
		getStyle: function(name) {
			name = YOM.string.toCamelCase(name);
			var el = this.get();
			var style = el.style[name];
			var computer = el.ownerDocument.defaultView;
			computer = computer && computer.getComputedStyle;
			if(style) {
				return style;
			}
			switch(name) {
			case 'opacity':
				if(computer) {
					style = computer(el, null)[name];
				} else {
					style = 100;
					try {
						style = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;
					} catch (e) {
						try {
							style = el.filters('alpha').opacity;
						} catch(e) {}
					}
					style = style / 100;
				}
				break;
			default:
				if(computer) {
					style = computer(el, null)[name];
				} else if(el.currentStyle) {
					style = el.currentStyle[name];
				} else {
					style = el.style[name];
				}
			}
			return style;
		},
		
		storeStyle: function(name) {
			if(YOM.array.isArray(name)) {
				YOM.object.each(name, function(nm) {
					this.storeStyle(nm);
				}, this);
			} else {
				this._styleStorage[name] = this.getStyle(name);
			}
			return this;
		},
		
		restoreStyle: function(name) {
			if(YOM.array.isArray(name)) {
				YOM.object.each(name, function(nm) {
					this.restoreStyle(nm);
				}, this);
			} else {
				if(typeof this._styleStorage[name] == 'undefined') {
					return this;
				}
				this.setStyle(name, this._styleStorage[name]);
			}
			return this;
		}
	});
	
	function Element(el) {
		this._items = [];
		if(el instanceof Element) {
			return el;
		} else if(YOM.array.isArray(el)) {
			YOM.object.each(el, function(item) {
				if(_isElementNode(item)) {
					this._items.push(new Item(item));
				}
			}, this);
		} else if(YOM.object.toString(el) == '[object NodeList]') {
			YOM.object.each(YOM.array.getArray(el), function(item) {
				this._items.push(new Item(item));
			}, this);
		} else if(_isElementNode(el)) {
			this._items.push(new Item(el));
		} else if(el && el.length && el.item) {//StaticNodeList, IE8/Opera
			for(var i = 0, l = el.length; i < l; i++) {
				this._items.push(new Item(el.item(i)));
			}
		}
		this._styleStorage = {};
		return this;
	};

	$extend(Element.prototype, {
		_getItem: function(i) {
			if(typeof i == 'undefined') {
				return this._items[0];
			} else {
				return this._items[i];
			}
		},
		
		get: function(i) {
			var item = this._getItem(i);
			return item && item.get();
		},
		
		getAll: function() {
			var res = [];
			this.each(function(el) {
				res.push(el);
			});
			return res;
		},
		
		find: function(sel) {
			var res = [];
			this.each(function(el) {
				var tmp;
				if(!_isElementNode(el)) {
					return;
				}
				tmp = document.querySelectorAll ? el.querySelectorAll(sel) : Sizzle(sel, el);
				if(YOM.array.isArray(tmp)) {
					res = res.concat(tmp);
				} else if(YOM.object.toString(tmp) == '[object NodeList]') {
					res = res.concat(YOM.array.getArray(tmp));
				} else if(tmp.length && tmp.item) {//StaticNodeList, IE8/Opera
					for(var i = 0, l = tmp.length; i < l; i++) {
						res.push(tmp.item(i));
					}
				}
			});
			return new Element(res);
		},
		
		toQueryString: function() {
			var res = [];
			this.find('input, select, textarea').each(function(el) {
				if(!el.name || el.disabled || el.type == 'button' || el.type == 'submit' || el.type == 'reset' || el.type == 'file') {
					return;
				}
				if(el.tagName.toLowerCase() == 'select') {
					for(var i = 0, l = el.options.length; i < l; i++) {
						if(el.options[i].selected) {
							res.push(el.name + '=' + encodeURIComponent(el.options[i].value));
						}
					}
				} else if(el.type != 'radio' && el.type != 'checkbox' || el.checked) {
					res.push(el.name + '=' + encodeURIComponent(el.value));
				}
			});
			return res.join('&');
		},
		
		size: function() {
			return this._items.length;
		},
		
		each: function(fn, bind) {
			var item;
			for(var i = 0, l = this._items.length; i < l; i++) {
				item = this._getItem(i);
				if(fn.call(bind || this, item.get(), i, item) === false) {
					return this;
				}
			}
			return this;
		},
		
		hasClass: function(className) {
			if(!this.size()) {
				return false;
			}
			var res = true;
			this.each(function(el) {
				if(!_hasClass(el, className)) {
					res = false;
					return false;
				}
				return true;
			});
			return res;
		},
		
		addClass: function(className) {
			this.each(function(el) {
				if(!_hasClass(el, className)) {
					el.className = el.className ? el.className + ' ' + className : className;
				}
			});
			return this;
		},
			
		removeClass: function(className) {
			this.each(function(el) {
				el.className = el.className.replace(new RegExp('(?:^|\\s+)' + className, 'g'), '');
			});
			return this;
		},
		
		toggleClass: function(className) {
			this.each(function(el) {
				if(_hasClass(el, className)) {
					el.className = el.className.replace(new RegExp('(?:^|\\s+)' + className, 'g'), '');
				} else {
					el.className = el.className ? el.className + ' ' + className : className;
				}
			});
			return this;
		},
		
		setAttr: function(name, value) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						$query(el).setAttr(key, val);
					});
				} else {
					if(!name) {
						return;
					}
					if(name.indexOf('data-') === 0 && el.dataset) {
						name = name.split('-');
						name.shift();
						$query(el).setDatasetVal(name.join('-'), value);
					} else if(name == 'class' || name == 'className') {
						el.className = value;
					} else {
						el.setAttribute(name, value);
					}
				}
			});
			return this;
		},
		
		removeAttr: function(name) {
			this.each(function(el) {
				el.removeAttribute(name);
			});
			return this;
		},
		
		getAttr: function(name) {
			var el = this.get();
			if(name == 'class' || name == 'className') {
				return el.className;
			} else if(el.nodeType !== 1 || el.tagName == 'HTML') {
				return '';
			} else {
				return el.getAttribute(name);
			}
		},
		
		setProp: function(name, val) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						$query(el).setProp(key, val);
					});
				} else {
					if(!name) {
						return;
					}
					el[name] = val;
				}
			});
			return this;
		},
		
		getProp: function(name) {
			var el = this.get();
			return el[name];
		},
		
		getDatasetVal: function(name) {
			var el = this.get();
			if(el.dataset) {
				return el.dataset[YOM.string.toCamelCase(name)];
			} else {
				return this.getAttr('data-' + YOM.string.toJoinCase(name, '-'));
			}
		},
		
		setDatasetVal: function(name, value) {
			this.each(function(el) {
				if(typeof name == 'object') {
					YOM.object.each(name, function(val, key) {
						$query(el).setDatasetVal(key, val);
					});
				} else {
					if(el.dataset) {
						el.dataset[YOM.string.toCamelCase(name)] = value;
					} else {
						this.setAttr('data-' + YOM.string.toJoinCase(name, '-'), value);
					}
				}
			});
			return this;
		},
		
		setVal: function(value) {
			this.each(function(el) {
				el.value = value;
			});
			return this;
		},
		
		getVal: function() {
			return this.get().value;
		},
		
		setStyle: function(name, value) {
			this.each(function(el, i, _item) {
				_item.setStyle(name, value);
			});
			return this;
		},
		
		getStyle: function(name) {
			return this._getItem(0).getStyle(name);
		},
		
		storeStyle: function(name) {
			this.each(function(el, i, _item) {
				_item.storeStyle(name);
			});
			return this;
		},
		
		restoreStyle: function(name) {
			this.each(function(el, i, _item) {
				_item.restoreStyle(name);
			});
			return this;
		},
		
		getScrolls: function() {
			var el = this.get();
			var parent = el.parentNode;
			var res = {left: 0, top: 0};
			while(parent && !Element.isBody(parent)) {
				res.left = parent.scrollLeft;
				res.top = parent.scrollTop;
				parent = parent.parentNode;
			}
			return res;
		},
		
		getScrollLeft: function() {
			var el = this.get();
			if(!el) {
				return 0;
			}
			if(Element.isBody(el)) {
				return Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
			} else {
				return el.scrollLeft;
			}
		},
		
		getScrollTop: function() {
			var el = this.get();
			if(!el) {
				return 0;
			}
			if(Element.isBody(el)) {
				return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
			} else {
				return el.scrollTop;
			}
		},
		
		scrollLeftBy: function(x, interval) {
			var el = this.get();
			if(!x || !el) {
				return this;
			}
			this.scrollLeftTo(this.getScrollLeft() + x, interval);
			return this;
		},
		
		scrollTopBy: function(y, interval) {
			var el = this.get();
			if(!y || !el) {
				return this;
			}
			this.scrollTopTo(this.getScrollTop() + y, interval);
			return this;
		},
		
		scrollLeftTo: function(x, interval, transition) {
			var el = this.get();
			if(!el || el.scrollLeft == x) {
				return this;
			}
			if(x instanceof Element) {
				this.scrollLeftTo(x.getRect(this).left, interval, transition);
				return this;
			}
			var rect = this.getRect();
			var viewRect = Element.getViewRect();
			var scrollWidth, clientWidth;
			var isBody = Element.isBody(el);
			if(isBody) {
				scrollWidth = rect.width;
				clientWidth = viewRect.width;
			} else {
				scrollWidth = el.scrollWidth;
				clientWidth = el.clientWidth;
			}
			if(scrollWidth <= clientWidth) {
				return this;
			}
			x = x < 0 ? 0 : (x > scrollWidth - clientWidth ? scrollWidth - clientWidth : x);
			var tweenObj = isBody ? $query(YOM.browser.chrome ? document.body : document.documentElement) : $query(el);
			if(interval === 0) {
				tweenObj.setProp('scrollLeft', x);
				return this;
			}
			tweenObj.tween(interval || 1000, {
				transition: transition || 'easeOut',
				origin: {
					prop: {
						scrollLeft: el.scrollLeft
					}
				},
				target: {
					prop: {
						scrollLeft: x
					}
				}
			});
			return this;
		},
		
		scrollTopTo: function(y, interval, transition) {
			var el = this.get();
			if(!el || el.scrollTop == y) {
				return this;
			}
			if(y instanceof Element) {
				this.scrollTopTo(y.getRect(this).top, interval, transition);
				return this;
			}
			var rect = this.getRect();
			var viewRect = Element.getViewRect();
			var scrollHeight, clientHeight;
			var isBody = Element.isBody(el);
			if(isBody) {
				scrollHeight = rect.height;
				clientHeight = viewRect.height;
			} else {
				scrollHeight = el.scrollHeight;
				clientHeight = el.clientHeight;
			}
			if(scrollHeight <= clientHeight) {
				return this;
			}
			y = y < 0 ? 0 : (y > scrollHeight - clientHeight ? scrollHeight - clientHeight : y);
			var tweenObj = isBody ? $query(YOM.browser.chrome ? document.body : document.documentElement) : $query(el);
			if(interval === 0) {
				tweenObj.setProp('scrollTop', y);
				return this;
			}
			tweenObj.tween(interval || 1000, {
				transition: transition || 'easeOut',
				origin: {
					prop: {
						scrollTop: el.scrollTop
					}
				},
				target: {
					prop: {
						scrollTop: y
					}
				}
			});
			return this;
		},
		
		getOffsetParent: function() {
			var el = this.get();
			if(!el || Element.isBody(el)) {
				return null;
			}
			return el.offsetParent && new Element(el.offsetParent);
		},
		
		getRect: function(relative) {
			var el, rect, docScrolls, elScrolls, res;
			el = this.get();
			if(Element.isBody(el)) {
				var bodySize = Element.getDocSize(el.ownerDocument);
				res = {
					top: 0, left: 0,
					width: bodySize.width,
					height: bodySize.height
				};
				res.right = res.width;
				res.bottom = res.height;
				return res;
			}
			rect = el.getBoundingClientRect && el.getBoundingClientRect();
			relative = relative ? $query(relative).getRect() : {top: 0, left: 0};
			docScrolls = Element.getViewRect();
			elScrolls = this.getScrolls();
			if(rect) {
				if(YOM.browser.ie && !YOM.browser.isQuirksMode() && (YOM.browser.v <= 7 || document.documentMode <= 7)) {
					rect.left -= 2;
					rect.top -= 2;
					rect.right -= 2;
					rect.bottom -= 2;
				}
				res = {
					top: rect.top + docScrolls.top - relative.top,
					left: rect.left + docScrolls.left - relative.left,
					bottom: rect.bottom + docScrolls.top - relative.top,
					right: rect.right + docScrolls.left - relative.left,
					width: rect.width || Math.max(el.clientWidth, el.offsetWidth),
					height: rect.height || Math.max(el.clientHeight, el.offsetHeight)
				};
			} else {
				res = {
					top: el.offsetTop - elScrolls.top - relative.top,
					left: el.offsetLeft - elScrolls.left - relative.left,
					bottom: 0,
					right: 0,
					width: Math.max(el.clientWidth, el.offsetWidth),
					height: Math.max(el.clientHeight, el.offsetHeight)
				};
				while(el.offsetParent) {
					el = el.offsetParent;
					res.top += el.offsetTop + (parseInt($query(el).getStyle('borderTopWidth')) || 0);
					res.left += el.offsetLeft + (parseInt($query(el).getStyle('borderLeftWidth')) || 0);
				}
				res.bottom = res.top + res.height - relative.top;
				res.right = res.left + res.width - relative.left;
			}
			return res;
		},
		
		setHtml: function(html) {
			this.get().innerHTML = html;
			return this;
		},
		
		removeChild: function(el) {
			if(!(el instanceof Element)) {
				el = this.find(el);
			}
			el.each(function(child) {
				child.parentNode.removeChild(child);
			});
			return this;
		},
		
		empty: function() {
			this.setHtml('');
			return this;
		},
		
		remove: function() {
			var el = this.get();
			if(!el || Element.isBody(el)) {
				return null;
			}
			return new Element(el.parentNode.removeChild(el));
		},
		
		getFirstChild: function() {
			var res;
			var el = this.get();
			if(!el) {
				return res;
			}
			$query(el.childNode || el.children).each(function(item) {
				if(_isElementNode(item)) {
					res = item;
					return false;
				}
				return true;
			});
			return res;
		},
		
		head: function(tar) {
			var firstChild = this.getFirstChild();
			if(firstChild) {
				return new Element(this.get().insertBefore(tar, firstChild));
			} else {
				return this.append(tar);
			}
		},
		
		headTo: function(tar) {
			tar = $query(tar);
			var firstChild = tar.getFirstChild();
			if(firstChild) {
				return new Element(tar.get().insertBefore(this.get(), firstChild));
			} else {
				return tar.append(this.get());
			}
		},
		
		append: function(el) {
			if(_isElementNode(el)) {
				return new Element(this.get().appendChild(el));
			} else if(el instanceof Element) {
				return new Element(this.get().appendChild(el.get()));
			}
			return null;
		},
		
		appendTo: function(parent) {
			var child = this.get();
			if(!child) {
				return null;
			}
			if(_isElementNode(parent)) {
				return new Element(parent.appendChild(child));
			} else if(parent instanceof Element) {
				return new Element(parent.append(child));
			}
			return null;
		},
		
		before: function(target) {
			var el = this.get();
			target = $query(target).get();
			if(!el || !target || Element.isBody(target)) {
				return this;
			}
			target.parentNode.insertBefore(el, target);
			return this;
		},
		
		after: function(target) {
			var el = this.get();
			target = $query(target).get();
			if(!el || !target || Element.isBody(target)) {
				return this;
			}
			if(target.nextSibling) {
				target.parentNode.insertBefore(el, target.nextSibling);
			} else {
				target.parentNode.appendChild(el);
			}
			return this;
		},
		
		clone: function(bool) {
			var el = this.get();
			if(el) {
				return new Element(el.cloneNode(bool));
			}
			return null;
		},
		
		show: function() {
			if(!this.size()) {
				return this;
			}
			var _display = this.getDatasetVal('yom-display');
			this.setStyle('display', _display == undefined ? 'block' : _display);
			return this;
		},
		
		hide: function() {
			if(!this.size()) {
				return this;
			}
			var _display = this.getStyle('display');
			if(_display != 'none' && this.getDatasetVal('yom-display') == undefined) {
				this.setDatasetVal('yom-display', _display);
			}
			this.setStyle('display', 'none');
			return this;
		},
		
		toggle: function(callback) {
			this.each(function(el) {
				el = $query(el);
				if(el.getStyle('display') == 'none') {
					el.show();
					callback && callback.call(el, 'SHOW');
				} else {
					el.hide();
					callback && callback.call(el, 'HIDE');
				}
			});
			return this;
		},
		
		addEventListener: function(eType, listener, bind) {
			var Event = require('yom/event');
			this.each(function(el) {
				Event.addListener(el, eType, listener, bind || el);
			});
			return this;
		},
		
		removeEventListener: function(eType, listener) {
			var Event = require('yom/event');
			this.each(function(el) {
				Event.removeListener(el, eType, listener);
			});
			return this;
		},
		
		concat: function(els) {
			return new Element(this.getAll().concat(new Element(els).getAll()));
		},
		
		removeItem: function(el) {
			YOM.array.remove(this._items, function(item, i) {
				if(typeof el == 'function') {
					return el(item.get(), i);
				} else if(typeof el == 'number') {
					if(el == i) {
						return -1;
					} else {
						return 0;
					}
				} else {
					return el == item.el;
				}
			});
			return this;
		}
	});
	
	Element._ID = 107;
	
	Element.head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	
	Element.isBody = function(el) {
		el = $query(el).get();
		if(!el) {
			return false;
		}
		return el.tagName == 'BODY' || el.tagName == 'HTML';
	};

	Element.create = function(name, attrs, style) {
		var el = $query(document.createElement(name));
		attrs && el.setAttr(attrs);
		style && el.setStyle(style);
		return el.get();
	};
	
	Element.contains = function(a, b) {
		return (a.contains) ? (a != b && a.contains(b)) : !!(a.compareDocumentPosition(b) & 16);
	};
	
	Element.getViewRect = function() {
		var res;
		res = {
			top: window.pageYOffset || Math.max(document.documentElement.scrollTop, document.body.scrollTop),
			left: window.pageXOffset || Math.max(document.documentElement.scrollLeft, document.body.scrollLeft),
			bottom: 0,
			right: 0,
			width: document.documentElement.clientWidth || document.body.clientWidth,
			height: document.documentElement.clientHeight || document.body.clientHeight
		};
		res.bottom = res.top + res.height;
		res.right = res.left + res.width;
		return res;
	};
	
	Element.getDocSize = function(doc) {
		var w, h;
		doc = doc || document;
		if(YOM.browser.isQuirksMode()) {
			if(YOM.browser.chrome || YOM.browser.safari || YOM.browser.firefox) {
				w = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth);
				h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
			} else {
				w = doc.body.scrollWidth || doc.documentElement.scrollWidth;
				h = doc.body.scrollHeight || doc.documentElement.scrollHeight;
			}
		} else {
			w = doc.documentElement.scrollWidth || doc.body.scrollWidth;
			h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
		}
		return {
			width: w,
			height: h
		};
	};
	
	return Element;
});
/**
 * YOM.Element FX extention, inspired by KISSY
 */
define('yom/element-fx', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object'),
		'array': require('yom/array'),
		'Element': require('yom/element')
	};
	
	$extend(YOM.Element.prototype, (function() {
		var _DURATION = 300;
		var _CONF = {
			fxShow: {style: ['overflow', 'opacity', 'width', 'height'], isShow: 1},
			fxHide: {style: ['overflow', 'opacity', 'width', 'height']},
			fxToggle: {style: []},
			fadeIn: {style: ['opacity'], isShow: 1},
			fadeOut: {style: ['opacity']},
			slideDown: {style: ['overflow', 'height'], isShow: 1},
			slideUp: {style: ['overflow', 'height']}
		};
		
		function _doFx(type, el, duration, complete) {
			var Tween = require('yom/tween');
			var conf, iStyle, oStyle, tStyle, isShow, width, height;
			Tween.stopAllTween(el);
			if(type == 'fxToggle') {
				type = el.getStyle('display') == 'none' ? 'fxShow' : 'fxHide';
			}
			conf = _CONF[type];
			iStyle = {};
			oStyle = {};
			tStyle = {};
			isShow = conf.isShow;
			isShow && el.show();
			YOM.object.each(conf.style, function(prop) {
				switch(prop) {
				case 'overflow':
					iStyle.overflow = el.getStyle('overflow');
					oStyle.overflow = 'hidden';
					break;
				case 'opacity':
					iStyle.opacity = 1;
					if(isShow) {
						oStyle.opacity = 0;
						tStyle.opacity = 1;
					} else {
						tStyle.opacity = 0;
					}
					break;
				case 'width':
					width = el.getStyle('width');
					iStyle.width = width;
					width = width == 'auto' ? Math.max(el.getAttr('clientWidth'), el.getAttr('offsetWidth')) + 'px' : width;
					if(isShow) {
						oStyle.width = '0px';
						tStyle.width = width;
					} else {
						oStyle.width = width;
						tStyle.width = '0px';
					}
					break;
				case 'height':
					height = el.getStyle('height');
					iStyle.height = height;
					height = height == 'auto' ? Math.max(el.getAttr('clientHeight'), el.getAttr('offsetHeight')) + 'px' : height;
					if(isShow) {
						oStyle.height = '0px';
						tStyle.height = height;
					} else {
						oStyle.height = height;
						tStyle.height = '0px';
					}
					break;
				default:
				}
			});
			el.setStyle(oStyle);
			new Tween(el, duration, {
				target: {
					style: tStyle
				},
				transition: 'easeOut',
				prior: true,
				complete: function() {
					isShow || el.hide();
					el.setStyle(iStyle);
					complete && complete.call(el, isShow ? 'SHOW' : 'HIDE');
				}
			}).play();
		};
		
		var fx = {
			tween: function() {
				var Tween = require('yom/tween');
				var args = YOM.array.getArray(arguments);
				this.each(function(el) {
					Tween.apply(this, [el].concat(args)).play();
				});
				return this;
			}
		};
		
		YOM.object.each(['fxShow', 'fxHide', 'fxToggle', 'fadeIn', 'fadeOut', 'slideDown', 'slideUp'], function(type) {
			fx[type] = function(duration, complete) {
				if(!this.size()) {
					return this;
				}
				var self = this;
				duration = duration || _DURATION;
				this.each(function(el) {
					_doFx.call(self, type, $query(el), duration, complete);
				});
				return this;
			};
		});
		
		return fx;
	})(), true);
	
	return {};
});
/**
 * @class YOM.Observer
 */
define('yom/observer', [], function() {
	var Observer = function () {
		this._subscribers = [];
	};
	
	Observer.prototype = {
		subscribe: function(subscriber, bind) {
			subscriber = bind ? $bind(bind, subscriber) : subscriber;
			for(var i = 0, l = this._subscribers.length; i < l; i++) {
				if(subscriber == this._subscribers[i]) {
					return null;
				}
			}
			this._subscribers.push(subscriber);
			return subscriber;
		},
		
		remove: function(subscriber) {
			var res = [];
			if(subscriber) {
				for(var i = this._subscribers.length - 1; i >= 0; i--) {
					if(subscriber == this._subscribers[i]) {
						res = res.concat(this._subscribers.splice(i, 1));
					}
				}
			} else {
				res = this._subscribers;
				this._subscribers = [];
			}
			return res;
		},
		
		dispatch: function(e, bind) {
			var res, tmp, subscriber;
			for(var i = this._subscribers.length - 1; i >= 0; i--) {
				subscriber = this._subscribers[i];
				if(!subscriber) {
					continue;				
				}
				tmp = subscriber.call(bind, e);
				res = tmp === false || res === false ? false : tmp;
			}
			return res;
		},
		
		constructor: Observer
	};
	
	Observer._ID = 111;
	
	return Observer;
});
/**
 * @class YOM.Event
 */
define('yom/event', ['require'], function(require) {
	var YOM = {
		'Error': require('yom/error'),
		'object': require('yom/object'),
		'Observer': require('yom/observer')
	};
	
	var _elRefCount = 0;
	_customizedEventHash = {
		
	};
	
	function _getObserver(instance, type) {
		if(!instance instanceof Event) {
			throw new YOM.Error(YOM.Error.getCode(Event._ID, 1));
		}
		instance._observers = instance._observers || {};
		instance._observers[type] = instance._observers[type] || new YOM.Observer();
		return instance._observers[type];
	};
	
	function _getObservers(instance) {
		if(!instance instanceof Event) {
			throw new YOM.Error(YOM.Error.getCode(Event._ID, 1));
		}
		instance._observers = instance._observers || {};
		return instance._observers;
	};
	
	function Event(observers) {
		this._observers = $getClean(observers) || {};
	};
	
	Event.prototype = {
		addObservers: function(newObservers) {
			var observers = _getObservers(this);
			newObservers = $getClean(newObservers);
			for(var type in newObservers) {
				if(newObservers[type] instanceof YOM.Observer) {
					observers[type] = newObservers[type];
				}
			}
		},
		
		addEventListener: function(type, listener, bind) {
			var observer = _getObserver(this, type);
			if(!observer) {
				throw new YOM.Error(YOM.Error.getCode(Event._ID, 1));
			}
			return observer.subscribe(listener, bind);
		},
		
		removeEventListener: function(type, listener) {
			var observer = _getObserver(this, type);
			if(!observer) {
				throw new YOM.Error(YOM.Error.getCode(Event._ID, 2));
			}
			return observer.remove(listener);
		},
		
		dispatchEvent: function(e, asyn) {
			if(typeof e == 'string') {
				e = {type: e};
			}
			var self = this;
			var observer = _getObserver(this, e.type);
			if(!observer) {
				throw new YOM.Error(YOM.Error.getCode(Event._ID, 3));
			}
			if(asyn) {
				setTimeout(function() {
					observer.dispatch.call(observer, e, self);
				}, 0);
				return undefined;
			} else {
				return observer.dispatch.call(observer, e, self);
			}
		},
		
		createEvent: function(type, opt) {
			var e = YOM.object.clone(opt) || {};
			e.type = type;
			return e;
		},
		
		constructor: Event
	};
	
	Event._ID = 108;
	
	Event.addListener = function(el, eType, listener, bind) {
		var cEvent, cEventHandler;
		eType = eType.toLowerCase();
		listener = bind ? $bind(bind, listener) : listener;
		cEvent = _customizedEventHash[eType];
		if(cEvent) {
			el.elEventRef = el.elEventRef || ++_elRefCount;
			cEventHandler = cEvent.elEventRefHandlerHash[el.elEventRef];
			if(!cEventHandler) {
				cEventHandler = cEvent.elEventRefHandlerHash[el.elEventRef] = new cEvent.Handler(el);
			}
			cEventHandler.addListener(listener);
		} else if(el.addEventListener) {
			el.addEventListener(eType, listener, false);
		} else {
			el.attachEvent('on' + eType, listener);
		}
		return listener;
	};
	
	Event.removeListener = function(el, eType, listener) {
		var cEvent, cEventHandler;
		eType = eType.toLowerCase();
		cEvent = _customizedEventHash[eType];
		if(cEvent) {
			cEventHandler = cEvent.elEventRefHandlerHash[el.elEventRef];
			if(cEventHandler) {
				cEventHandler.removeListener(listener);
			}
		} else if(el.removeEventListener) {
			el.removeEventListener(eType, listener, false);
		} else {
			el.detachEvent('on' + eType, listener);
		}
	};
	
	Event.addCustomizedEvent = function(type, Handler) {
		_customizedEventHash[type] = {
			Handler: Handler,
			elEventRefHandlerHash: {}
		};
	};
	
	Event.removeCustomizedEventHandler = function(type, ref) {
		var cEvent = _customizedEventHash[type];
		if(cEvent) {
			cEvent.elEventRefHandlerHash[ref] = null;
		}
	};
	
	Event.cancelBubble = function(e) {
		if(e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
	};
	
	Event.preventDefault = function(e) {
		if(e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
	};
	
	Event.getTarget = function(e) {
		return e.target || e.srcElement;
	};
	
	Event.getPageX = function(e) {
		return e.pageX != undefined ? e.pageX : e.clientX + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
	};
	
	Event.getPageY = function(e) {
		return e.pageY != undefined ? e.pageY : e.clientY + Math.max(document.documentElement.scrollTop, document.body.scrollTop);
	};
	
	return Event;
});
/**
 * @class YOM.Event.Delegator
 */
define('yom/event-delegator', ['require'], function(require) {
	var YOM = {
		'Event': require('yom/event')
	};
	
	var _pageDelegator;
	
	/**
	 * @class
	 */
	function Delegator(ele, opt) {
		opt = opt || {};
		this._ele = $query(ele);
		this._delegatedTypes = {};
		this._handlers = {};
		this._eventHook = opt.eventHook;
	};
	
	Delegator.getPageDelegator = function() {
		_pageDelegator = _pageDelegator || new Delegator(document.body);
		return _pageDelegator;
	};
	
	Delegator.prototype = {
		delegate: function(type, handlerName, handler, opt) {
			type = type.toLowerCase();
			opt = opt || {};
			this._delegateEvent(type, opt.maxBubble >= 0 ? opt.maxBubble : 1983);
			this._handlers[type][handlerName] = handler;
			return this;
		},
		
		remove: function(type, handlerName) {
			if(!this._delegatedTypes[type]) {
				return;
			}
			if(handlerName) {
				delete this._handlers[type][handlerName];
			} else {
				this._ele.removeEventListener(type, this._delegatedTypes[type].listener);
				delete this._handlers[type];
				delete this._delegatedTypes[type];
			}
		},
		
		_delegateEvent: function(type, maxBubble) {
			var flag = this._delegatedTypes[type];
			if(flag) {
				flag.maxBubble = Math.max(flag.maxBubble, maxBubble);
				return;
			} else {
				var listener = $bind(this, this._eventListener);
				this._ele.addEventListener(type, listener);
				this._handlers[type] = {};
				this._delegatedTypes[type] = {maxBubble: maxBubble, listener: listener};
			}
		},
		
		_eventListener: function(evt) {
			var target, $target, type, flag, handler, maxBubble, bubbleTimes;
			target = YOM.Event.getTarget(evt);
			type = evt.type.toLowerCase();
			if(this._eventHook && this._eventHook(target, evt, type) === false) {
				return;
			}
			maxBubble = this._delegatedTypes[type].maxBubble;
			bubbleTimes = 0;
			while(target && target != this._ele) {
				$target = $query(target);
				if(target.disabled || $target.getAttr('disabled')) {
					return;
				}
				flag = $target.getDatasetVal('yom-' + type);
				if(flag) {
					flag = flag.split(' ');
					handler = this._handlers[type][flag.shift()];
					flag.unshift(evt);
					if(handler && handler.apply(target, flag) === false) {
						break;
					}
				}
				if(bubbleTimes >= maxBubble) {
					break;
				}
				target = target.parentNode;
				bubbleTimes++;
			}
		},
		
		constructor: Delegator
	};
	
	return Delegator;
});
/**
 * @class YOM.Event.VirtualEventHandler
 */
define('yom/event-virtual-handler', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object'),
		'Event': require('yom/event')
	};
	
	var VirtualEventHandler = function(el) {
		this._delegateEl = el;
		this._targetEl = null;
		this._listenerPool = [];
		this._listenerCount = 0;
	};
	
	VirtualEventHandler.prototype = {
		_destroy: function() {
			YOM.Event.removeCustomizedEventHandler(this.name, this._delegateEl.elEventRef);
		},
		
		_dispatch: function(e) {
			YOM.object.each(this._listenerPool, function(listener) {
				listener(e);
			});
		},
		
		addListener: function(listener) {
			var found;
			if(!listener) {
				return null;
			}
			YOM.object.each(this._listenerPool, function(item) {
				if(listener == item) {
					found = 1;
					return false;
				}
				return true;
			});
			if(found) {
				return null;
			}
			this._listenerCount++;
			return this._listenerPool.push(listener);
		},
		
		removeListener: function(listener) {
			var found = null;
			var self = this;
			YOM.object.each(this._listenerPool, function(item, i) {
				if(listener == item) {
					found = item;
					self._listenerPool.splice(i, 1);
					this._listenerCount--;
					return false;
				}
				return true;
			});
			if(!this._listenerCount) {
				this._destroy();
			}
			return found;
		},
		
		constructor: VirtualEventHandler
	};
	
	return VirtualEventHandler;
});
/**
 * @class YOM.Event.MouseenterEventHandler
 */
define('yom/event-mouseenter', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'Class': require('yom/class'),
		'array': require('yom/array'),
		'Event': require('yom/event'),
		'Element': require('yom/element')
	};
	YOM.Event.VirtualEventHandler = require('yom/event-virtual-handler');
	
	var MouseenterEventHandler = function(el) {
		this.name = 'mouseenter';
		MouseenterEventHandler.superClass.constructor.apply(this, YOM.array.getArray(arguments));
		this._bound = {
			mouseover: $bind(this, this._mouseover)
		};
		YOM.Event.addListener(this._delegateEl, 'mouseover', this._bound.mouseover);
	};
	
	YOM.Class.extend(MouseenterEventHandler, YOM.Event.VirtualEventHandler);
	
	MouseenterEventHandler.prototype._destroy = function() {
		YOM.Event.removeListener(this._delegateEl, 'mouseover', this._bound.mouseover);
		MouseenterEventHandler.superClass._destroy.apply(this, YOM.array.getArray(arguments));
	};
		
	MouseenterEventHandler.prototype._mouseover = function(e) {
		if(!YOM.Element.contains(this._delegateEl, e.relatedTarget)) {
			e.cType = this.name;
			this._dispatch(e);
		}
	};
	
	YOM.browser.ie || YOM.Event.addCustomizedEvent('mouseenter', MouseenterEventHandler);
	
	return MouseenterEventHandler;
});
/**
 * @class YOM.Event.MouseleaveEventHandler
 */
define('yom/event-mouseleave', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'Class': require('yom/class'),
		'array': require('yom/array'),
		'Event': require('yom/event'),
		'Element': require('yom/element')
	};
	YOM.Event.VirtualEventHandler = require('yom/event-virtual-handler');
	
	var MouseleaveEventHandler = function(el) {
		this.name = 'mouseleave';
		MouseleaveEventHandler.superClass.constructor.apply(this, YOM.array.getArray(arguments));
		this._bound = {
			mouseout: $bind(this, this._mouseout)
		};
		YOM.Event.addListener(this._delegateEl, 'mouseout', this._bound.mouseout);
	};
	
	YOM.Class.extend(MouseleaveEventHandler, YOM.Event.VirtualEventHandler);
	
	MouseleaveEventHandler.prototype._destroy = function() {
		YOM.Event.removeListener(this._delegateEl, 'mouseout', this._bound.mouseout);
		MouseleaveEventHandler.superClass._destroy.apply(this, YOM.array.getArray(arguments));
	};
		
	MouseleaveEventHandler.prototype._mouseout = function(e) {
		if(!YOM.Element.contains(this._delegateEl, e.relatedTarget)) {
			e.cType = this.name;
			this._dispatch(e);
		}
	};
	
	YOM.browser.ie || YOM.Event.addCustomizedEvent('mouseleave', MouseleaveEventHandler);
	
	return MouseleaveEventHandler;
});
/**
 * @namespace YOM.cookie
 */
define('yom/cookie', [], {
	_ID: 105,
	DOMAIN: 'webyom.org',
	
	set: function(name, value, domain, path, hour) {
		var expire;
		if(hour) {
			expire = new Date();
			expire.setTime(expire.getTime() + 3600000 * hour);
		}
		document.cookie = (name + '=' + value + '; ') + (expire ? ('expires=' + expire.toGMTString() + '; ') : '') + ('path=' + (path || '/') + '; ') + ('domain=' + (domain || this.DOMAIN) + ';');
	},
	
	get: function(name) {
		var r = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'), m = document.cookie.match(r);
		return m && m[1] || '';
	},
	
	del: function(name, domain, path) {
		document.cookie = name + '=; expires=Mon, 26 Jul 1997 05:00:00 GMT; ' + ('path=' + (path || '/') + '; ') + ('domain=' + (domain || this.DOMAIN) + ';');
	}
});
/**
 * @namespace YOM.Xhr
 */
define('yom/xhr', ['require'], function(require) {
	var YOM = {
		'config': require('yom/config'),
		'Error': require('yom/error'),
		'Class': require('yom/class'),
		'object': require('yom/object'),
		'InstanceManager': require('yom/instance-manager'),
		'Observer': require('yom/observer'),
		'Event': require('yom/event')
	};
	
	var _ID = 116;
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ABORTED: 3
	};
	
	var _loading_count = 0;
	var _im = new YOM.InstanceManager();
	
 	function Xhr(url, opt) {
		opt = opt || {};
		this._opt = opt;
		this._method = (opt.method == 'GET' ? 'GET' : 'POST');
		this._param = typeof opt.param == 'object' ? YOM.object.toQueryString(opt.param) : opt.param;
		this._formData = opt.formData;
		this._charset = opt.charset;
		this._url = url + (opt.method == 'GET' && this._param ? '?' + this._param : '');
		this._status = _STATUS.INIT;
		this._onload = opt.load || $empty;
		this._onabort = opt.abort || $empty;
		this._onerror = opt.error || $empty;
		this._oncomplete = opt.complete || $empty;
		this._bind = opt.bind;
		this._xhr = null;
		this._gid = opt.gid;//group id
		this._id = _im.add(this);
	};
	
	YOM.Class.extend(Xhr, YOM.Event);
	YOM.Class.genericize(Xhr, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: Xhr});
	Xhr.addObservers({
		start: new YOM.Observer(),
		complete: new YOM.Observer(),
		allcomplete: new YOM.Observer()
	});
	
	Xhr._im = _im;
	
	Xhr.RET = {
		SUCC: 0,
		ABORTED: -1,
		ERROR: 1	
	};
	
	Xhr.abortAll = function(gid) {
		var noGid = typeof gid == 'undefined';
		_im.each(function(inst) {
			if(noGid || inst.getGid() == gid) {
				inst.abort();
			}
		});
	};
	
	Xhr.isUrlLoading = function(url, fullMatch) {
		var res = false;
		if(!url) {
			return res;
		}
		_im.each(function(inst) {
			if(fullMatch && url == inst._url || inst._url.indexOf(url) === 0) {
				res = true;
				return false;
			}
			return true;
		});
		return res;
	};
	
	Xhr.isAnyLoading = function() {
		return _loading_count > 0;
	};
	
	_onReadyStateChange = function() {
		if(this._xhr.readyState !== 4 || this._status == _STATUS.ABORTED) {
			return;
		}
		this._status = _STATUS.LOADED;
		if(this._xhr.status >= 200 && this._xhr.status < 300) {
			this._complete(Xhr.RET.SUCC);
			this._onload.call(this._bind, this._xhr.responseText, this._xhr.responseXML);
		} else {
			this._complete(Xhr.RET.ERROR);
			this._onerror.call(this._bind, new YOM.Error(YOM.Error.getCode(_ID, 1), 'Xhr request failed.'));
		}
	};
	
	Xhr.prototype._complete = function(ret) {
		this._opt.silent || _loading_count > 0 && _loading_count--;
		_im.remove(this.getId());
		try {
			_loading_count === 0 && Xhr.dispatchEvent(Xhr.createEvent('allcomplete', {url: this._url, method: this._method, opt: this._opt, ret: ret}));
			Xhr.dispatchEvent(Xhr.createEvent('complete', {url: this._url, method: this._method, opt: this._opt, ret: ret}));
		} catch(e) {
			if(YOM.config.debugMode) {
				throw new YOM.Error(YOM.Error.getCode(_ID, 2));
			}
		}
		this._oncomplete.call(this._bind, ret);
	};
	
	Xhr.prototype.getId = function() {
		return this._id;
	};
	
	Xhr.prototype.getGid = function() {
		return this._gid;
	};
	
	Xhr.prototype.send = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		try {
			this._xhr = new XMLHttpRequest();
		} catch(e) {
			this._xhr = new ActiveXObject('MSXML2.XMLHTTP');
		}
		this._xhr.open(this._method, this._url, this._opt.isAsync === false ? false : true);
		if(this._method == 'GET') {
			if(this._opt.noCache) {
				this._xhr.setRequestHeader('If-Modified-Since', 'Sun, 27 Mar 1983 00:00:00 GMT');
				this._xhr.setRequestHeader('Cache-Control', 'no-cache');
			}
		} else if(!this._formData) {
			this._xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded' + (this._charset ? '; charset=' + this._charset : ''));
		}
		if(this._opt.withCredentials) {
			this._xhr.withCredentials = true;
		}
		this._xhr.onreadystatechange = $bind(this, _onReadyStateChange);
		this._status = _STATUS.LOADING;
		this._opt.silent || _loading_count++;
		this._xhr.send(this._method == 'POST' ? (this._formData || this._param) : null);
		Xhr.dispatchEvent(Xhr.createEvent('start', {url: this._url, method: this._method, opt: this._opt}));
		return 0;
	};
	
	Xhr.prototype.abort = function () {
		if(this._status != _STATUS.LOADING) {
			return 1;
		}
		this._xhr.abort();
		this._status = _STATUS.ABORTED;
		this._complete(Xhr.RET.ABORTED);
		this._onabort.call(this._bind);
		return 0;
	};
	
	Xhr.prototype.getXhrObj = function () {
		return this._xhr;
	};
	
	return Xhr;
});
/**
 * @class YOM.CrossDomainPoster
 */
define('yom/cross-domain-poster', ['require'], function(require) {
	var YOM = {
		'config': require('yom/config'),
		'Error': require('yom/error'),
		'Class': require('yom/class'),
		'InstanceManager': require('yom/instance-manager'),
		'json': require('yom/json'),
		'Observer': require('yom/observer'),
		'Event': require('yom/event'),
		'Element': require('yom/element')
	};
	
	var _ID = 125;
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ABORTED: 3
	};
	var _PROXY = require.toUrl('./cdp-proxy.html', true);
	var _CROSS_SITE_PROXY = require.toUrl('./cdp-cs-proxy.html', true);
	
	var _sameSiteTester = new RegExp(':\\/\\/(?:[^\\.]+\\.)*' + YOM.config.domain + '\\/');
	var _im = new YOM.InstanceManager();
	var _loading_count = 0;
	
	var CrossDomainPoster = function(url, opt) {
		opt = opt || {};
		this._opt = opt;
		this._url = url;
		this._charset = (opt.charset || 'utf-8').toLowerCase();
		this._data = opt.data || {};
		this._onload = opt.load || $empty;
		this._onerror = opt.error || $empty;
		this._oncomplete = opt.complete || $empty;
		this._onabort = opt.abort || $empty;
		this._bind = opt.bind;
		this._crossSite = !_sameSiteTester.test(url);//cross top level domain
		this._proxy = opt.proxy || _PROXY;
		this._crossSiteProxy = opt.crossSiteProxy || _CROSS_SITE_PROXY;
		this._proxyParamName = opt.proxyParamName || '_response_url_';
		this._frameEl = null;
		this._frameOnLoadListener = null;
		this._status = _STATUS.INIT;
		this._id = _im.add(this);
	};
	
	YOM.Class.extend(CrossDomainPoster, YOM.Event);
	YOM.Class.genericize(CrossDomainPoster, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: CrossDomainPoster});
	CrossDomainPoster.addObservers({
		start: new YOM.Observer(),
		complete: new YOM.Observer(),
		allcomplete: new YOM.Observer()
	});
	
	CrossDomainPoster._im = _im;
	
	CrossDomainPoster.RET = {
		SUCC: 0,
		ABORTED: -1,
		ERROR: 1	
	};
	
	CrossDomainPoster.isUrlLoading = function(url, fullMatch) {
		var res = false;
		if(!url) {
			return res;
		}
		_im.each(function(inst) {
			if(fullMatch && url == inst._url || inst._url.indexOf(url) === 0) {
				res = true;
				return false;
			}
			return true;
		});
		return res;
	};
	
	CrossDomainPoster.isAnyLoading = function() {
		return _loading_count > 0;
	};
	
	CrossDomainPoster.getInstance = function(id) {
		return _im.get(id);
	};
	
	CrossDomainPoster.prototype._complete = function(ret) {
		_loading_count > 0 && _loading_count--;
		this._clear();
		try {
			_loading_count === 0 && CrossDomainPoster.dispatchEvent(CrossDomainPoster.createEvent('allcomplete', {url: this._url, opt: this._opt}));
		CrossDomainPoster.dispatchEvent(CrossDomainPoster.createEvent('complete', {url: this._url, opt: this._opt, ret: ret}));
		} catch(e) {
			if(YOM.config.debugMode) {
				throw new YOM.Error(YOM.Error.getCode(_ID, 1));
			}
		}
		this._oncomplete.call(this._bind, ret);
	};
	
	CrossDomainPoster.prototype._frameOnLoad = function() {
		if(this._crossSite) {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			var data;
			var parseError = false;
			try {
				data = YOM.json.parse(this._frameEl.contentWindow.name);
			} catch(e) {
				parseError = true;
			}
			if(parseError) {
				this._complete(CrossDomainPoster.RET.ERROR);
				this._onerror.call(this._bind);
				if(YOM.config.debugMode) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1));
				}
			} else {
				this._complete(CrossDomainPoster.RET.SUCC);
				this._onload.call(this._bind, data);
			}
		} else {
			if(this._frameEl) {
				this._complete(CrossDomainPoster.RET.ERROR);
				this._onerror.call(this._bind);
			}
		}
	};
	
	CrossDomainPoster.prototype._clear = function() {
		if(!this._frameEl) {
			return;
		}
		YOM.Event.removeListener(this._frameEl, 'load', this._frameOnLoadListener);
		document.body.removeChild(this._frameEl);
		this._frameEl = null;
		_im.remove(this.getId());
	};
		
	CrossDomainPoster.prototype.getId = function() {
		return this._id;
	};
		
	CrossDomainPoster.prototype.post = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		this._frameEl = YOM.Element.create('iframe', {src: this._proxy}, {display: 'none'});
		this._frameEl.instanceId = this.getId();
		this._frameEl.callback = $bind(this, function(o) {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			this._complete(CrossDomainPoster.RET.SUCC);
			this._onload.call(this._bind, o);
		});
		this._frameOnLoadListener = $bind(this, this._frameOnLoad);
		YOM.Event.addListener(this._frameEl, 'load', this._frameOnLoadListener);
		this._frameEl = document.body.appendChild(this._frameEl);
		this._status = _STATUS.LOADING;
		_loading_count++;
		CrossDomainPoster.dispatchEvent(CrossDomainPoster.createEvent('start', {url: this._url, opt: this._opt}));
		return 0;
	};
	
	CrossDomainPoster.prototype.abort = function() {
		if(this._status != _STATUS.LOADING) {
			return 1;
		}
		this._status = _STATUS.ABORTED;
		this._complete(CrossDomainPoster.RET.ABORTED);
		this._onabort.call(this._bind);
		return 0;
	};
	
	return CrossDomainPoster;
});
/**
 * @namespace YOM.pos
 */
define('yom/pos', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object')
	};
	
	return {
		_ID: 112,
		
		getPos: function(onSuccess, onFail) {
			if(navigator.geolocation && navigator.geolocation.getCurrentPosition) {
				navigator.geolocation.getCurrentPosition(function (position) {
					if(YOM.object.isFunction(onSuccess)) {
						onSuccess.call(position, position.coords.latitude, position.coords.longitude);
					}
				}, onFail);
			} else {
				onFail({
					code: 0,
					message: 'Not Supported'
				});
			}
		},
		
		watchPos: function(onSuccess, onFail) {
			if(navigator.geolocation && navigator.geolocation.watchPosition) {
				return navigator.geolocation.watchPosition(function (position) {
					if(YOM.object.isFunction(onSuccess)) {
						onSuccess.call(position, position.coords.latitude, position.coords.longitude);
					}
				}, onFail);
			} else {
				onFail({
					code: 0,
					message: 'Not Supported'
				});
				return null;
			}
		},
		
		clearWatch: function(watchHandler) {
			if(watchHandler && navigator.geolocation && navigator.geolocation.clearWatch) {
				navigator.geolocation.clearWatch(watchHandler);
			}
		}
	};
});
/**
 * @namespace YOM.util
 */
define('yom/util', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object')
	};
	
	return {
		_ID: 115,
		
		getUrlParam: function(name, loc) {
			loc = loc || window.location;
			var r = new RegExp('(\\?|#|&)' + name + '=(.*?)(&|#|$)');
			var m = (loc.href || '').match(r);
			return (m ? m[2] : '');
		},
		
		getUrlParams: function(loc) {
			loc = loc || window.location;
			var raw = loc.search, res = {}, p, i;
			if(raw) {
				raw = raw.slice(1);
				raw = raw.split('&');
				for(i = 0, l = raw.length; i < l; i++) {
					p = raw[i].split('=');
					res[p[0]] = p[1] || '';
				}
			}
			raw = loc.hash;
			if(raw) {
				raw = raw.slice(1);
				raw = raw.split('&');
				for(i = 0, l = raw.length; i < l; i++) {
					p = raw[i].split('=');
					res[p[0]] = res[p[0]] || p[1] || '';
				}
			}
			return res;
		},
		
		appendQueryString: function(url, param, isHashMode) {
			if(typeof param == 'object') {
				param = YOM.object.toQueryString(param);
			} else if(typeof param == 'string') {
				param = param.replace(/^&/, '');
			} else {
				param = '';
			}
			if(!param) {
				return url;
			}
			if(isHashMode) {
				if(url.indexOf('#') == -1) {
					url += '#' + param;
				} else {
					url += '&' + param;
				}
			} else {
				if(url.indexOf('#') == -1) {
					if(url.indexOf('?') == -1) {
						url += '?' + param;
					} else {
						url += '&' + param;
					}
				} else {
					var tmp = url.split('#');
					if(tmp[0].indexOf('?') == -1) {
						url = tmp[0] + '?' + param + '#' + (tmp[1] || '');
					} else {
						url = tmp[0] + '&' + param + '#' + (tmp[1] || '');
					}
				}
			}
			return url;
		}
	};
});
/**
 * @class YOM.JsLoader
 */
define('yom/js-loader', ['require'], function(require) {
	var YOM = {
		'config': require('yom/config'),
		'Error': require('yom/error'),
		'browser': require('yom/browser'),
		'Class': require('yom/class'),
		'array': require('yom/array'),
		'InstanceManager': require('yom/instance-manager'),
		'Observer': require('yom/observer'),
		'Event': require('yom/event'),
		'Element': require('yom/element'),
		'util': require('yom/util')
	};
	
	var _TIMEOUT = 60000;
	var _STATUS = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ABORTED: 3,
		TIMEOUT: 4
	};
	
	var _callbackQueueHash = {};
	var _callbackLoadingHash = {};
	var _loading_count = 0;
	var _im = new YOM.InstanceManager();
	
	var JsLoader = function(src, opt) {
		opt = opt || {};
		this._rawSrc = src;
		this._src = YOM.util.appendQueryString(src, opt.param);
		this._opt = opt;
		this._charset = opt.charset;
		this._callback = opt.callback;
		this._callbackName = opt.callbackName || '$JsLoaderCallback';
		this._onload = opt.load || $empty;
		this._onabort = opt.abort || $empty;
		this._onerror = opt.error;
		this._oncomplete = opt.complete || $empty;
		this._bind = opt.bind;
		this._random = opt.random;
		this._jsEl = null;
		this._status = _STATUS.INIT;
		this._callbacked = false;
		this._gid = opt.gid;//group id
		this._id = _im.add(this);
	};
	
	JsLoader._ID = 109;
	
	JsLoader._im = _im;
	
	YOM.Class.extend(JsLoader, YOM.Event);
	YOM.Class.genericize(JsLoader, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: JsLoader});
	JsLoader.addObservers({
		start: new YOM.Observer(),
		complete: new YOM.Observer(),
		allcomplete: new YOM.Observer()
	});
	
	JsLoader.RET = {
		SUCC: 0,
		ABORTED: -1,
		ERROR: 1,
		TIMEOUT: 2
	};
	
	JsLoader.abortAll = function(gid) {
		var noGid = typeof gid == 'undefined';
		_im.each(function(inst) {
			inst.abort();
			if(noGid || inst.getGid() == gid) {
				inst.abort();
			}
		});
	};
	
	JsLoader.isUrlLoading = function(url, fullMatch) {
		var res = false;
		if(!url) {
			return res;
		}
		_im.each(function(inst) {
			if(fullMatch && url == inst._src || inst._src.indexOf(url) === 0) {
				res = true;
				return false;
			}
			return true;
		});
		return res;
	};
	
	JsLoader.isAnyLoading = function() {
		return _loading_count > 0;
	};
	
	JsLoader.prototype._clear = function() {
		_im.remove(this.getId());
		if(!this._jsEl) {
			return;
		}
		this._jsEl.parentNode.removeChild(this._jsEl);
		this._jsEl = null;
		if(this._callback) {
			_callbackLoadingHash[this._callbackName] = 0;
			if(_callbackQueueHash[this._callbackName] && _callbackQueueHash[this._callbackName].length) {
				_callbackQueueHash[this._callbackName].shift().load();
			}
		}
	};
	
	JsLoader.prototype._dealError = function(code) {
		if(this._onerror) {
			this._onerror.call(this._bind, code);
		} else {
			throw new YOM.Error(code);
		}
	};
	
	JsLoader.prototype._complete = function(ret) {
		this._opt.silent || _loading_count > 0 && _loading_count--;
		this._clear();
		try {
			_loading_count === 0 && JsLoader.dispatchEvent(JsLoader.createEvent('allcomplete', {src: this._src, opt: this._opt, ret: ret}));
			JsLoader.dispatchEvent(JsLoader.createEvent('complete', {src: this._src, opt: this._opt, ret: ret}));
		} catch(e) {
			if(YOM.config.debugMode) {
				throw new YOM.Error(YOM.Error.getCode(JsLoader._ID, 2));
			}
		}
		this._oncomplete.call(this._bind, ret);
	};
	
	JsLoader.prototype.getId = function() {
		return this._id;
	};
	
	JsLoader.prototype.getGid = function() {
		return this._gid;
	};
	
	JsLoader.prototype.load = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		var self = this;
		if(this._callback) {
			if(_callbackLoadingHash[this._callbackName]) {
				_callbackQueueHash[this._callbackName] = _callbackQueueHash[this._callbackName] || [];
				_callbackQueueHash[this._callbackName].push(this);
				return -1;
			}
			_callbackLoadingHash[this._callbackName] = 1;
			window[this._callbackName] = $bind(this, function() {
				this._callbacked = true;
				if(this._status != _STATUS.LOADING) {
					return;
				}
				this._callback.apply(this._bind || this, YOM.array.getArray(arguments));
				window[this._callbackName] = null;
			});
		}
		function onload() {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			this._complete(JsLoader.RET.SUCC);
			if(this._callback && !this._callbacked) {
				this._dealError(YOM.Error.getCode(JsLoader._ID, 1));
			}
			this._onload.call(this._bind);
		};
		function onerror() {
			if(this._status != _STATUS.LOADING) {
				return;
			}
			this._status = _STATUS.LOADED;
			this._complete(JsLoader.RET.ERROR);
			this._dealError(YOM.Error.getCode(JsLoader._ID, 0));
		};
		this._jsEl = document.createElement('script');
		if(YOM.browser.ie) {
			YOM.Event.addListener(this._jsEl, 'readystatechange', function() {
				if(this._jsEl && (this._jsEl.readyState == 'loaded' || this._jsEl.readyState == 'complete')) {
					onload.call(this);
					return;
				}
			}, this);
		} else {
			YOM.Event.addListener(this._jsEl, 'load', function() {
				onload.call(this);
			}, this);
			YOM.Event.addListener(this._jsEl, 'error', function() {
				onerror.call(this);
			}, this);
		}
		if(this._charset) {
			this._jsEl.charset = this._charset;
		}
		this._jsEl.type = 'text/javascript';
		this._jsEl.async = 'async';
		this._jsEl.src = this._src;
		this._status = _STATUS.LOADING;
		this._opt.silent || _loading_count++;
		this._jsEl = YOM.Element.head.insertBefore(this._jsEl, YOM.Element.head.firstChild);
		setTimeout(function() {
			if(self._status != _STATUS.LOADING) {
				return;
			}
			self._status = _STATUS.TIMEOUT;
			self._complete(JsLoader.RET.TIMEOUT);
			self._dealError(YOM.Error.getCode(JsLoader._ID, 2));
		}, this._opt.timeout || _TIMEOUT);
		JsLoader.dispatchEvent(JsLoader.createEvent('start', {src: this._src, opt: this._opt}));
		return 0;
	};
	
	JsLoader.prototype.abort = function() {
		if(this._status != _STATUS.LOADING) {
			return 1;
		}
		this._status = _STATUS.ABORTED;
		this._complete(JsLoader.RET.ABORTED);
		this._onabort.call(this._bind);
		return 0;
	};
	
	return JsLoader;
});
/**
 * @namespace YOM.css
 */
define('yom/css', ['require'], function(require) {
	var YOM = {
		'object': require('yom/object'),
		'array': require('yom/array'),
		'Class': require('yom/class'),
		'Event': require('yom/event'),
		'Element': require('yom/element')
	};
	
	var _linkCount = 0;
	var _href_id_hash = {};
	
	function load(href, force) {
		var id, el;
		if(YOM.array.isArray(href)) {
			id = [];
			YOM.object.each(href, function(item) {
				id.push(load(item, force));
			});
			return id;
		}
		id = _href_id_hash[href];
		el = $id(id);
		if(id && el) {
			if(force) {
				unload(href);
			} else {
				return id;
			}
		}
		id = $getUniqueId();
		el = YOM.Element.create('link', {
			id: id,
			rel: 'stylesheet',
			type: 'text/css',
			media: 'screen',
			href: href
		});
		YOM.Element.head.insertBefore(el, YOM.Element.head.firstChild);
		return _href_id_hash[href] = id;
	};
	
	function unload(href) {
		var el;
		if(YOM.array.isArray(href)) {
			el = [];
			YOM.object.each(href, function(item) {
				el.push(unload(item));
			});
			return el;
		}
		el = $id(_href_id_hash[href]);
		if(el) {
			delete _href_id_hash[href];
			return el.parentNode.removeChild(el);
		}
		return null;
	};
	
	var Css = function() {
		Css.superClass.constructor.apply(this, YOM.array.getArray(arguments));
	};
	YOM.Class.extend(Css, YOM.Event);
	
	return $extend(new Css({
	}), {
		_ID: 106,
		load: load,
		unload: unload
	});
});
/**
 * @namespace YOM.tmpl
 */
define('yom/tmpl', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'string': require('yom/string'),
		'object': require('yom/object')
	};
	
	var _cache = {};
	var _useArrayJoin = YOM.browser.ie;
	
	function _getMixinTmplStr(rawStr, mixinTmpl) {
		if(mixinTmpl) {
			YOM.object.each(mixinTmpl, function(val, key) {
				var r = new RegExp('<%#' + key + '%>', 'g');
				rawStr = rawStr.replace(r, val);
			});
		}
		return rawStr;
	};
	
	function render(str, data, opt) {
		var strict, key, fn;
		str += '';
		data = data || {};
		opt = opt || {};
		strict = opt.strict;
		key = opt.key;
		if(key) {
			fn = _cache[key];
			if(fn) {
				return fn(data);
			}
		}
		if(opt.mixinTmpl) {
			str = _getMixinTmplStr(str, opt.mixinTmpl);
		}
		fn = _useArrayJoin ? 
		new Function("$data", "var YOM=this,_$out_=[],$print=function(str){_$out_.push(str);};" + (strict ? "" : "with($data){") + "_$out_.push('" + str
			.replace(/[\r\t\n]/g, " ")
			.split("<%").join("\t")
			.replace(/(?:^|%>).*?(?:\t|$)/g, function($0) {
				return $0.replace(/('|\\)/g, '\\$1');
			})
			.replace(/\t==(.*?)%>/g, "',YOM.string.encodeHtml($1),'")
			.replace(/\t=(.*?)%>/g, "',$1,'")
			.split("\t").join("');")
			.split("%>").join("_$out_.push('")
		+ "');" + (strict ? "" : "}") + "return _$out_.join('');") : 
		new Function("$data", "var YOM=this,_$out_='',$print=function(str){_$out_+=str;};" + (strict ? "" : "with($data){") + "_$out_+='" + str
			.replace(/[\r\t\n]/g, " ")
			.split("<%").join("\t")
			.replace(/(?:^|%>).*?(?:\t|$)/g, function($0) {
				return $0.replace(/('|\\)/g, '\\$1');
			})
			.replace(/\t==(.*?)%>/g, "'+YOM.string.encodeHtml($1)+'")
			.replace(/\t=(.*?)%>/g, "'+($1)+'")
			.split("\t").join("';")
			.split("%>").join("_$out_+='")
		+ "';" + (strict ? "" : "}") + "return _$out_;");
		if(key) {
			_cache[key] = fn;
		}
		return fn.call(YOM, data);
	};
	
	function renderId(id, data, opt) {
		data = data || {};
		opt = opt || {};
		var key = opt.key = opt.key || id;
		var fn = _cache[key];
		if(fn) {
			return fn(data);
		}
		return render($id(id).innerHTML, data, opt);
	};
	
	return {
		_ID: 114,
		render: render,
		renderId: renderId
	};
});
/**
 * @namespace YOM.console
 */
define('yom/console', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'string': require('yom/string'),
		'object': require('yom/object'),
		'array': require('yom/array'),
		'json': require('yom/json'),
		'Event': require('yom/event'),
		'Element': require('yom/element'),
		'tmpl': require('yom/tmpl'),
		'Chunker': require('yom/chunker')
	};
	
	var _TMPL = [
		'<div style="background: #555; padding: 2px; padding-top: 0; font-size: 12px; font-family: Courier New, Courier, monospace;">',
			'<h2 style="margin: 0; font-size: 14px; line-height: 22px; color: #fff; padding: 2px; padding-top: 0;">',
				'<span style="float: left;">Console</span>',
				'<span title="Maxmize" id="yomConsoleColExpBtn" style="float: right; cursor: pointer; padding: 0 3px;">^</span>',
				'<span title="Clear" id="yomConsoleClearBtn" style="float: right; cursor: pointer; padding: 0 3px; margin-right: 10px;">[C]</span>',
			'</h2>',
			'<div id="yomConsoleOutput" style="clear: both; height: 300px; overflow-y: scroll; background: #fff; padding: 0; display: none; text-align: left;">',
				'<div id="yomConsoleOutputBox" style="line-height: 15px;"></div>',
				'<div>',
					'<label for="yomConsoleInputBox" style="font-weight: bold; color: blue;">&gt;&gt;</label>',
					'<input id="yomConsoleInputBox" type="text" style="width: 458px; border: none; font-family: Courier New, Courier, monospace;" onkeyup="if(event.keyCode === 13) {YOM.console.eval(this.value); return false;}" ondblclick="YOM.console.eval(this.value); return false;" />',
				'</div>',
			'</div>',
			'<div style="height: 0; line-height: 0; clear: both;">&nbsp;</div>',
		'</div>'
	].join('');
	
	var _on = 0;
	var _el = {};
	var _chunker = null;
	var _data = [];
	var _inited = false;
	
	function _inputFocus(str) {
		try {
			if(typeof str == 'string') {
				_el.inputBox.value = str;
			}
			_el.inputBox.focus();
			_el.inputBox.select();
		} catch(e) {}
	};
	
	function _colExp() {
		$query(_el.output).toggle(function(type) {
			if(type == 'SHOW') {
				_el.colExpBtn.innerHTML = '-';
				_el.colExpBtn.title = 'Minimize';
				_el.container.style.width = '500px';
				_inputFocus();
			} else {
				_el.colExpBtn.innerHTML = '^';
				_el.colExpBtn.title = 'Maxmize';
				_el.container.style.width = '160px';
			}
		});
	};
	
	function _clear() {
		_el.outputBox.innerHTML = '';
		_inputFocus('');
	};
	
	function _init() {
		if(_inited) {
			return;
		}
		_inited = true;
		var isIe6 = YOM.browser.ie && YOM.browser.v === 6;
		_el.container = document.body.appendChild(YOM.Element.create('div', {
			id: 'yomConsole'
		}, {
			display: _on ? 'block' : 'none',
			position: isIe6 ? 'absolute' : 'fixed',
			width: '160px',
			zIndex: '99999',
			right: 0,
			bottom: isIe6 ? Math.max(0, YOM.Element.getDocSize().height - YOM.Element.getViewRect().bottom) + 'px' : 0
		}));
		_el.container.innerHTML = YOM.tmpl.render(_TMPL, {});
		_el.output = $id('yomConsoleOutput');
		_el.outputBox = $id('yomConsoleOutputBox');
		_el.inputBox = $id('yomConsoleInputBox');
		_el.colExpBtn = $id('yomConsoleColExpBtn');
		_el.clearBtn = $id('yomConsoleClearBtn');
		YOM.Event.addListener(_el.colExpBtn, 'click', _colExp);
		YOM.Event.addListener(_el.clearBtn, 'click', _clear);
		_chunker = _chunker || new YOM.Chunker(_log, {interval2: 1000});
		_chunker.push(_data, true);
		_chunker.process();
		_data = [];
	};
	
	function _getEvtDelegator() {
		var delegator = new YOM.Event.Delegator(_el.outputBox);
		_getEvtDelegator = function() {
			return delegator;
		};
		return delegator;
	};
	
	function _expandObjStr(obj, objLevel) {
		var tmp, indent;
		var expanded = parseInt(this.getAttribute('_exp'));
		indent = [];
		for(var i = 0; i < objLevel; i++) {
			indent.push('&nbsp;&nbsp;&nbsp;&nbsp;');
		}
		if(YOM.array.isArray(obj)) {
			this.innerHTML = expanded ? 'Array[' + obj.length + ']' : _stringifyObj(obj, objLevel);
		} else {
			if(expanded) {
				try {
					tmp = obj.toString();
				} catch(e) {
					tmp = YOM.object.toString(obj);
				}
				this.innerHTML = tmp;
			} else {
				tmp = [];
				try {
					YOM.object.each(obj, function(val, key) {
						if(val === YOM.object.PRIVATE_PROPERTY) {
							val = '[Private Property]';
						}
						tmp.push(indent.join('') + '"' + key + '": ' + _stringifyObj(val, objLevel + 1));
					});
				} catch(e) {
					tmp = [indent.join('') + 'Access Denied!'];
				}
				indent.pop();
				if(tmp.length) {
					this.innerHTML = '{<br />' + tmp.join(', <br />') + '<br />' + indent.join('') + '}';
				} else {
					this.innerHTML = '{}';
				}
			}
		}
		if(expanded) {
			this.setAttribute('_exp', '0');
		} else {
			this.setAttribute('_exp', '1');
		}
		this.setAttribute('_exp', expanded ? '0' : '1');
	};
	
	function _stringifyObj(obj, objLevel, isArritem) {
		objLevel = objLevel || 1;
		var tmp, res;
		var rdm = new Date().getTime() + '' + parseInt(Math.random() * 10000);
		if(typeof obj == 'string') {
			res = '"' + YOM.string.encodeHtml(obj) + '"';
		} else if(YOM.array.isArray(obj)) {
			if(isArritem) {
				_getEvtDelegator().delegate('click', 'consoleItem' + rdm, function(e) {
					_expandObjStr.call(this, obj, objLevel);
				}, {maxBubble: 0}).delegate('mouseover', 'consoleItem' + rdm, function(e) {
					this.style.background = '#eee';
				}, {maxBubble: 0}).delegate('mouseout', 'consoleItem' + rdm, function(e) {
					this.style.background = '';
				}, {maxBubble: 0});
				res = '<span _exp="0" data-yom-click="consoleItem' + rdm + '" data-yom-mouseover="consoleItem' + rdm + '" data-yom-mouseout="consoleItem' + rdm + '" style="cursor: pointer;">Array[' + obj.length + ']</span>';
			} else {
				tmp = [];
				YOM.object.each(obj, function(item) {
					tmp.push(_stringifyObj(item, objLevel, 1));
				});
				res = '[' + tmp.join(', ') + ']';
			}
		} else if(typeof obj == 'object' && obj) {
			_getEvtDelegator().delegate('click', 'consoleItem' + rdm, function(e) {
				_expandObjStr.call(this, obj, objLevel);
			}, {maxBubble: 0}).delegate('mouseover', 'consoleItem' + rdm, function(e) {
				this.style.background = '#eee';
			}, {maxBubble: 0}).delegate('mouseout', 'consoleItem' + rdm, function(e) {
				this.style.background = '';
			}, {maxBubble: 0});
			try {
				tmp = obj.toString();
			} catch(e) {
				tmp = YOM.object.toString(obj);
			}
			res = '<span _exp="0" data-yom-click="consoleItem' + rdm + '" data-yom-mouseover="consoleItem' + rdm + '" data-yom-mouseout="consoleItem' + rdm + '" style="cursor: pointer;">' + tmp + '</span>';
		} else {
			res = YOM.string.encodeHtml(obj);
		}
		return res.replace(/\n/g, '<br />').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
	};
	
	function _log(str, type, lead) {
		var p = _el.outputBox.appendChild(YOM.Element.create('p', {}, {
			margin: 0,
			borderBottom: 'solid 1px #f3f3f3',
			padding: '2px 0',
			wordWrap: 'break-word'
		}));
		p.innerHTML = '<span style="color: blue;">' + (lead || '&gt;') + '</span>' + '<span style="color: ' + (type === 0 ? 'green' : type === 1 ? 'red' : 'black') + '; margin-left: 2px;">' + str + '</span>';
		_el.output.scrollTop = 999999999;
	};
	
	function log(str, type, lead) {
		_init();
		if(typeof str != 'string') {
			str = _stringifyObj(str);
		}
		if(_on && _chunker) {
			_chunker.push([str, type, lead]);
		} else {
			_data.push([str, type, lead]);
		}
		return this;
	};
	
	function eval(str) {
		if(str) {
			this.log('<span style="color: blue;">' + YOM.string.encodeHtml(str) + '</span>', '', '&gt;&gt;');
			try {
				this.log(_stringifyObj(window.eval(str)));
			} catch(e) {
				this.log(new YOM.Error(e).toString(), 1);
			}
			_inputFocus('');
		}
		return this;
	};
	
	function error(str) {
		log(str, 1);
		return this;
	};
	
	function success(str) {
		log(str, 0);
		return this;
	};
	
	function show() {
		$query(_el.container).show();
		return this;
	};
	
	function hide() {
		$query(_el.container).hide();
		return this;
	};
	
	function turnOn() {
		_on = 1;
		_init();
		if(_chunker) {
			_chunker.push(_data, true);
			_data = [];
		}
		show();
		return this;
	};
	
	function turnOff() {
		_on = 0;
		hide();
		return this;
	};
	
	return {
		_ID: 118,
		log: log,
		eval: eval,
		error: error,
		success: success,
		show: show,
		hide: hide,
		turnOn: turnOn,
		turnOff: turnOff
	};
});
/**
 * Inspired by KISSY
 * @namespace YOM.transition
 */
define('yom/transition', [], function() {
	var _BACK_CONST = 1.70158;
	return {
		css: {
			linear: 'linear',
			ease: 'ease',
			easeIn: 'ease-in',
			easeOut: 'ease-out',
			easeInOut: 'ease-in-out'
		},
		
		linear: function(t) {
			return t;
		},
		
		/**
		 * Begins slowly and accelerates towards end. (quadratic)
		 */
		easeIn: function (t) {
			return t * t;
		},
	
		/**
		 * Begins quickly and decelerates towards end.  (quadratic)
		 */
		easeOut: function (t) {
			return ( 2 - t) * t;
		},
		
		/**
		 * Begins slowly and decelerates towards end. (quadratic)
		 */
		easeInOut: function (t) {
			return (t *= 2) < 1 ?
				0.5 * t * t :
				0.5 * (1 - (--t) * (t - 2));
		},
		
		/**
		 * Begins slowly and accelerates towards end. (quartic)
		 */
		easeInStrong: function (t) {
			return t * t * t * t;
		},
		
		/**
		 * Begins quickly and decelerates towards end.  (quartic)
		 */
		easeOutStrong: function (t) {
			return 1 - (--t) * t * t * t;
		},
		
		/**
		 * Begins slowly and decelerates towards end. (quartic)
		 */
		easeInOutStrong: function (t) {
			return (t *= 2) < 1 ?
				0.5 * t * t * t * t :
				0.5 * (2 - (t -= 2) * t * t * t);
		},
		
		/**
		 * Snap in elastic effect.
		 */
		elasticIn: function (t) {
			var p = 0.3, s = p / 4;
			if (t === 0 || t === 1) return t;
			return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
		},
		
		/**
		 * Snap out elastic effect.
		 */
		elasticOut: function (t) {
			var p = 0.3, s = p / 4;
			if (t === 0 || t === 1) return t;
			return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
		},
		
		/**
		 * Snap both elastic effect.
		 */
		elasticInOut: function (t) {
			var p = 0.45, s = p / 4;
			if (t === 0 || (t *= 2) === 2) return t / 2;
			if (t < 1) {
				return -0.5 * (Math.pow(2, 10 * (t -= 1)) *
				Math.sin((t - s) * (2 * Math.PI) / p));
			}
			return Math.pow(2, -10 * (t -= 1)) *
			Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1;
		},
	
		/**
		 * Backtracks slightly, then reverses direction and moves to end.
		 */
		backIn: function (t) {
			if (t === 1) t -= 0.001;
			return t * t * ((_BACK_CONST + 1) * t - _BACK_CONST);
		},
		
		/**
		 * Overshoots end, then reverses and comes back to end.
		 */
		backOut: function (t) {
			return (t -= 1) * t * ((_BACK_CONST + 1) * t + _BACK_CONST) + 1;
		},
		
		/**
		 * Backtracks slightly, then reverses direction, overshoots end,
		 * then reverses and comes back to end.
		 */
		backInOut: function (t) {
			if ((t *= 2 ) < 1) {
				return 0.5 * (t * t * (((_BACK_CONST *= (1.525)) + 1) * t - _BACK_CONST));
			}
			return 0.5 * ((t -= 2) * t * (((_BACK_CONST *= (1.525)) + 1) * t + _BACK_CONST) + 2);
		},
		
		/**
		 * Bounce off of start.
		 */
		bounceIn: function (t) {
			return 1 - Easing.bounceOut(1 - t);
		},
		
		/**
		 * Bounces off end.
		 */
		bounceOut: function (t) {
			var s = 7.5625, r;
			if (t < (1 / 2.75)) {
				r = s * t * t;
			}
			else if (t < (2 / 2.75)) {
				r =  s * (t -= (1.5 / 2.75)) * t + 0.75;
			}
			else if (t < (2.5 / 2.75)) {
				r =  s * (t -= (2.25 / 2.75)) * t + 0.9375;
			}
			else {
				r =  s * (t -= (2.625 / 2.75)) * t + 0.984375;
			}
			return r;
		},
		
		/**
		 * Bounces off start and end.
		 */
		bounceInOut: function (t) {
			if (t < 0.5) {
				return Easing.bounceIn(t * 2) * 0.5;
			}
			return Easing.bounceOut(t * 2 - 1) * 0.5 + 0.5;
		}
	};
});
/**
 * Inspired by KISSY
 * @class YOM.Tween
 */
define('yom/tween', ['require'], function(require) {
	var YOM = {
		'browser': require('yom/browser'),
		'object': require('yom/object'),
		'InstanceManager': require('yom/instance-manager'),
		'Element': require('yom/element'),
		'transition': require('yom/transition')
	};
	
	var _ID = 120;
	var _STATUS = {
		INIT: 0,
		TWEENING: 1,
		STOPPED: 2
	};
	var _STYLE_PROPS = [
		'backgroundColor', 'borderBottomColor', 'borderBottomWidth', 'borderBottomStyle', 'borderLeftColor', 'borderLeftWidth', 'borderLeftStyle', 'borderRightColor', 'borderRightWidth', 'borderRightStyle', 'borderSpacing', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'bottom', 'color', 'font', 'fontFamily', 'fontSize', 'fontWeight', 'height', 'left', 'letterSpacing', 'lineHeight', 'marginBottom', 'marginLeft', 'marginRight', 'marginTop', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'opacity', 'outlineColor', 'outlineOffset', 'outlineWidth', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'right', 'textIndent', 'top', 'width', 'wordSpacing', 'zIndex', 'position'
	];
	var _FPS = 60;
	
	var _im = new YOM.InstanceManager();
	var _parserEl = null;
	
	var _requestAnimationFrame = window.requestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.oRequestAnimationFrame
	|| window.msRequestAnimationFrame
	|| function(callback) {
		return setTimeout(callback, 1000 / _FPS);
	}
	
	var _cancelAnimationFrame = window.cancelAnimationFrame
	|| window.webkitCancelAnimationFrame
	|| window.mozCancelAnimationFrame
	|| window.oCancelAnimationFrame
	|| window.msCancelAnimationFrame
	|| function(timer) {
		clearTimeout(timer);
	};
	
	function _getParserEl() {
		if(!_parserEl) {
			_parserEl = YOM.Element.create('div');
		}
		return _parserEl;
	};
	
	function _getRgbVal(str) {
		var res;
		str += '';
		if(str.indexOf('rgb') === 0) {
			res = str.match(/\d+/g);
		} else if(str.indexOf('#') === 0) {
			if(str.length === 4) {
				str = '#' + str.slice(1, 2) + str.slice(1, 2) + str.slice(2, 3) + str.slice(2, 3) + str.slice(3, 4) + str.slice(3, 4);
			}
			res = [parseInt(str.slice(1, 3), 16) || 0, parseInt(str.slice(3, 5), 16) || 0, parseInt(str.slice(5, 7), 16) || 0];
		}
		return res || [];
	};
	
	function _calColorVal(source, target, percent) {
		var srcTmp = _getRgbVal(source);
		var tarTmp = _getRgbVal(target);
		if(!tarTmp.length) {
			return target;
		}
		var tmp = [];
		for(var i = 0; i < 4; i++) {
			srcTmp[i] = parseInt(srcTmp[i]) || 0;
			tarTmp[i] = parseInt(tarTmp[i]) || 0;
			tmp[i] = parseInt(srcTmp[i] + (tarTmp[i] - srcTmp[i]) * percent);
			tmp[i] = tmp[i] < 0 ? 0 : tmp[i] > 255 ? 255 : tmp[i];
		}
		if(target.indexOf('rgba') === 0) {
			return 'rgba(' + tmp.join(',') + ')';
		} else {
			tmp.pop();
			return 'rgb(' + tmp.join(',') + ')';
		}
	};
	
	function _calNumVal(origin, target, percent) {
		return origin + (target - origin) * percent;
	};
	
	function _calStrVal(origin, target, percent) {
		return percent === 1 ? target : origin;
	};
	
	function _parsePropVal(val) {
		var v, u;
		val = val + '';
		v = parseFloat(val);
		u = val.replace(/^[-\d\.]+/, '');
		return isNaN(v) ? {v: val, u: '', f: (/^#|rgb/).test(val) ? _calColorVal : _calStrVal} : {v: v, u: u, f: _calNumVal};
	};
	
	function _getStyle(style) {
		var res = {};
		var parserEl;
		if(!style) {
			return res;
		}
		if(typeof style == 'string') {
			parserEl = _getParserEl();
			parserEl.innerHTML = '<div style="' + style + '"></div>';
			style = parserEl.firstChild.style;
		}
		YOM.object.each(_STYLE_PROPS, function(prop) {
			var val = style[prop];
			if(val || val === 0) {
				res[prop] = _parsePropVal(val);
			}
		});
		return res;
	};
	
	function _getOriginStyle(el, target, origin) {
		var res = {};
		origin = _getStyle(origin);
		YOM.object.each(target, function(propVal, propName) {
			var val;
			if(origin[propName]) {
				res[propName] = origin[propName];
			} else {
				val = el.getStyle(propName);
				if(val || val === 0) {
					res[propName] = _parsePropVal(val);
				} else {
					res[propName] = propVal;
				}
			}
		});
		return res;
	};
	
	function _getProp(prop) {
		var res = {};
		YOM.object.each(prop, function(propVal, propName) {
			res[propName] = _parsePropVal(propVal);
		});
		return res;
	};
	
	function _getOriginProp(el, target, origin) {
		var res = {};
		origin = _getProp(origin);
		YOM.object.each(target, function(propVal, propName) {
			var val;
			if(origin[propName]) {
				res[propName] = origin[propName];
			} else {
				val = el.getProp(propName);
				if(val != undefined) {
					res[propName] = _parsePropVal(val);
				} else {
					res[propName] = propVal;
				}
			}
		});
		return res;
	};
	
	function Tween(el, duration, opt) {
		if(!(this instanceof Tween)) {
			return new Tween(el, duration, opt);
		}
		opt = opt || {};
		opt.origin = opt.origin || {};
		opt.target = opt.target || {};
		this._opt = opt;
		this._el = $query(el);
		this._duration = duration;
		this._css = opt.css && !opt.target.prop && Tween.getCssTransitionName();
		this._targetStyle = _getStyle(opt.target.style);
		this._originStyle = _getOriginStyle(this._el, this._targetStyle, opt.origin.style);
		this._targetProp = _getProp(opt.target.prop);
		this._originProp = _getOriginProp(this._el, this._targetProp, opt.origin.prop);
		this._transition = YOM.transition[opt.transition] || opt.transition || YOM.transition['linear'];
		this._complete = opt.complete || $empty;
		this._timer = null;
		this._status = _STATUS.INIT;
		this._id = _im.add(this);
		return this;
	};
	
	Tween._im = _im;
	
	Tween.getCssTransitionName = function() {
		var el = $query(_getParserEl());
		var name = 'transition';
		var isSupport = el.getStyle(name) != undefined;
		if(!isSupport) {
			if(YOM.browser.chrome || YOM.browser.safari || YOM.browser.ipad || YOM.browser.iphone || YOM.browser.android) {
				name = '-webkit-transition';
			} else if(YOM.browser.firefox) {
				name = '-moz-transition';
			} else if(YOM.browser.opera) {
				name = '-o-transition';
			} else if(YOM.browser.ie) {
				name = '-ms-transition';
			} else {
				name = '';
			}
			if(name) {
				isSupport = el.getStyle(name) != undefined;
				if(!isSupport) {
					name = '';
				}
			}
		}
		Tween.getCssTransitionName = function() {
			return name;
		};
		return name;
	};
	
	Tween.setTimer = function(setter, duration, callback, transition) {
		transition = YOM.transition[transition] || transition || YOM.transition['linear'];
		var start = $now();
		var end = start + duration;
		setter(_requestAnimationFrame(function() {
			var now = $now();
			var percent = now >= end ? 1 : (now - start) / duration;
			percent = Math.min(transition(percent), 1);
			callback(percent);
			if(percent < 1) {
				setter(_requestAnimationFrame(arguments.callee));
			}
		}));
	};

	Tween.stopAllTween = function(el) {
		$query(el).each(function(el) {
			var tweenObj = _im.get($query(el).getDatasetVal('yom-tween-oid'));
			tweenObj && tweenObj.stop();
		});
	};
	
	Tween.cancelTimer = _cancelAnimationFrame;
	
	Tween.prototype._stopAllTween = function() {
		Tween.stopAllTween(this._el);
	};
	
	Tween.prototype._removeTweeningEl = function() {
		this._el.removeItem(function(el) {
			var tweenObj = _im.get($query(el).getDatasetVal('yom-tween-oid'));
			return tweenObj && tweenObj.isTweening();
		});
	};
	
	Tween.prototype._cssTween = function() {
		var self = this;
		var originStyle = this._originStyle;
		var targetStyle = this._targetStyle;
		var timingFunction = YOM.transition.css[this._opt.transition] || this._opt.transition || YOM.transition.css['linear'];
		var tVal;
		for(prop in originStyle) {
			tVal = originStyle[prop];
			this._el.setStyle(prop, tVal.v + tVal.u);
		}
		this._el.each(function(el) {
			el.clientLeft;//force reflow
		});
		this._el.storeStyle(this._css + '-duration');
		this._el.storeStyle(this._css + '-timing-function');
		this._el.setStyle(this._css + '-duration', this._duration + 'ms');
		this._el.setStyle(this._css + '-timing-function', timingFunction);
		for(prop in targetStyle) {
			tVal = targetStyle[prop];
			this._el.setStyle(prop, tVal.v + tVal.u);
		}
		this._timer = setTimeout(function() {
			self.stop();
		}, this._duration);
	};
	
	Tween.prototype.isTweening = function() {
		return this._status == _STATUS.TWEENING;
	};
	
	Tween.prototype.play = function() {
		if(this._status != _STATUS.INIT) {
			return 1;
		}
		if(this._opt.prior) {
			this._stopAllTween();
		} else {
			this._removeTweeningEl();
		}
		if(!this._el.size()) {
			return 2;
		}
		this._status = _STATUS.TWEENING;
		this._el.setDatasetVal('yom-tween-oid', this._id);
		var self = this;
		var targetStyle = this._targetStyle;
		var originStyle = this._originStyle;
		var targetProp = this._targetProp;
		var originProp = this._originProp;
		var prop, oVal, tVal;
		if(this._css) {
			this._cssTween();
		} else {
			Tween.setTimer(function(timer) {self._timer = timer;}, this._duration, function(percent) {
				if(self._status == _STATUS.STOPPED) {
					return;
				}
				for(prop in targetStyle) {
					tVal = targetStyle[prop];
					oVal = originStyle[prop];
					if(oVal.u != tVal.u) {
						oVal.v = 0;
					}
					self._el.setStyle(prop, tVal.f(oVal.v, tVal.v, percent) + tVal.u);
				}
				for(prop in targetProp) {
					tVal = targetProp[prop];
					oVal = originProp[prop];
					if(oVal.u != tVal.u) {
						oVal.v = 0;
					}
					self._el.setProp(prop, tVal.f(oVal.v, tVal.v, percent) + tVal.u);
				}
				if(percent === 1) {
					self.stop();
				}
			}, this._transition);
		}
		return 0;
	};
	
	Tween.prototype.stop = function() {
		if(this._status == _STATUS.STOPPED) {
			return;
		}
		var el = this._el;
		var status = this._status;
		if(this._css) {
			this._el.restoreStyle(this._css + '-duration');
			this._el.restoreStyle(this._css + '-timing-function');
			clearTimeout(this._timer);
		} else {
			_cancelAnimationFrame(this._timer);
		}
		this._el = null;
		this._status = _STATUS.STOPPED;
		_im.remove(this._id);
		if(status != _STATUS.INIT && this._complete) {
			this._complete(el);
		}
	};
	
	return Tween;
});
/**
 * @namespace
 */
define('yom/widget', [], {
	_ID: 128
});
/**
 * @namespace
 */
define(['require', document.querySelectorAll ? '' : 'yom/inc/sizzle'], function(require, Sizzle) {
	var YOM = function(sel, context) {
		return $query(sel, context);
	};
	
	YOM._ID = 100;
	YOM.debugMode = 0;
	
	YOM = $extend(YOM, {
		'Error': require('yom/error'),
		'browser': require('yom/browser'),
		'string': require('yom/string'),
		'object': require('yom/object'),
		'array': require('yom/array'),
		'Chunker': require('yom/chunker'),
		'Class': require('yom/class'),
		'HashArray': require('yom/hash-array'),
		'InstanceManager': require('yom/instance-manager'),
		'json': require('yom/json'),
		'Observer': require('yom/observer'),
		'Event': require('yom/event'),
		'Element': require('yom/element'),
		'cookie': require('yom/cookie'),
		'Xhr': require('yom/xhr'),
		'CrossDomainPoster': require('yom/cross-domain-poster'),
		'pos': require('yom/pos'),
		'util': require('yom/util'),
		'JsLoader': require('yom/js-loader'),
		'css': require('yom/css'),
		'tmpl': require('yom/tmpl'),
		'console': require('yom/console'),
		'transition': require('yom/transition'),
		'Tween': require('yom/tween'),
		'widget': require('yom/widget')
	});
	
	YOM.Event = $extend(YOM.Event, {
		'Delegator': require('yom/event-delegator'),
		'VirtualEventHandler': require('yom/event-virtual-handler'),
		'MouseenterEventHandler': require('yom/event-mouseenter'),
		'MouseleaveEventHandler': require('yom/event-mouseleave')
	});
	
	require('yom/element-fx');
	
	return YOM;
});

function $id(id) {
	return document.getElementById(id);
};

function $query(sel, context) {
	var Element = require('yom/element');
	var res;
	if(sel instanceof Element) {
		return sel;
	} else if(typeof sel == 'string') {
		if(context) {
			context = new Element(typeof context == 'string' ? (document.querySelectorAll ? document.querySelectorAll(context) : Sizzle(context)) : context);
			res = context.find(sel);
		} else {
			res = new Element(document.querySelectorAll ? document.querySelectorAll(sel) : Sizzle(sel));
		}
	} else {
		res = new Element(sel);
	}
	return res;
};

function $getClean(obj) {
	var object = require('yom/object');
	var cleaned;
	if(obj && obj.getClean) {
		cleaned = obj.getClean();
	} else if(typeof obj == 'object') {
		cleaned = {};
		for(var p in obj) {
			if(object.hasOwnProperty(obj, p)) {
				cleaned[p] = obj[p];
			}
		}
	} else {
		cleaned = obj;
	}
	return cleaned;
};

function $extend(origin, extend, check) {
	var object = require('yom/object');
	return object.extend(origin, extend, check);
};

function $bind(that, fn) {
	var array = require('yom/array');
	if(fn.bind) {
		return fn.bind(that);
	} else {
		return function() {
			return fn.apply(that, array.getArray(arguments));
		};
	}
};

function $now() {
	return +new Date();
};

function $empty() {};

var _yom_unique_id_count = 0;
function $getUniqueId() {
	return 'YOM_UNIQUE_ID_' + _yom_unique_id_count++;	
};
