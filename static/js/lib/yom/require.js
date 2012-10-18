/**
 * YOM module define and require lib
 * Inspired by RequireJS AMD spec
 * @author Gary Wang webyom@gmail.com webyom.org
 */
var define, require;

(function(global) {
	/**
	 * utils
	 */
	var _head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
	var _isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
	var _op = Object.prototype;
	var _ots = _op.toString;
	
	var _isArray = Array.isArray || function(obj) {
		return _ots.call(obj) == '[object Array]';
	};
	
	function _getArray(arr) {
		return Array.prototype.slice.call(arr);
	};
	
	function _isFunction(obj) {
		return _ots.call(obj) == '[object Function]';
	};
	
	function _hasOwnProperty(obj, prop) {
		return _op.hasOwnProperty.call(obj, prop);
	};
	
	function _trimTailSlash(path) {
		return path.replace(/\/+$/, '');
	};
	
	function _each(arr, callback) {
		for(var i = 0, l = arr.length; i < l; i++) {
			callback(arr[i], i, arr);
		}
	};
	
	function _extend(origin, extend, check) {
		origin = origin || {};
		for(var p in extend) {
			if(_hasOwnProperty(extend, p) && (!check || typeof origin[p] == 'undefined')) {
				origin[p] = extend[p];
			}
		}
		return origin;
	};
	
	function _clone(obj, deep) {
		if(typeof obj == 'object' && obj) {
			var res;
			if(_isArray(obj)) {
				res = [];
				_each(obj, function(item) {
					res.push(item);
				});
			} else {
				res = {};
				for(var p in obj) {
					if(_hasOwnProperty(obj, p)) {
						res[p] = deep ? _clone(obj[p], deep) : obj[p];
					}
				}
			}
			return res;
		}
		return obj;
	};
	
	function _getInteractiveScript() {
		var script, scripts;
		scripts = document.getElementsByTagName('script');
		for(var i = 0; i < scripts.length; i++) {
			script = scripts[i];
			if(script.readyState == 'interactive') {
				return script;
			}
		}
		return script;
	};
	
	/**
	 * config
	 */
	var _RESERVED_NRM_ID = {
		require: 1,
		exports: 1,
		module: 1,
		domready: 1
	};
	var _ERR_CODE = {
		DEFAULT: 1,
		TIMEOUT: 2,
		LOAD_ERROR: 3,
		NO_DEFINE: 4
	};
	
	var _gcfg = _extend({
		charset: 'utf-8',
		baseUrl: location.href.split('/').slice(0, -1).join('/'),
		source: {},
		path: {},//match by id removed prefix
		shim: {},//match by id removed prefix
		urlArgs: {//match by id removed prefix
			'*': ''//for all
		},
		errCallback: null,
		onLoadStart: null,
		onLoadEnd: null,
		waitSeconds: 30
	}, typeof require == 'object' && require);//global config
	_gcfg.baseUrl = _getFullBaseUrl(_gcfg.baseUrl);
	var _interactiveMode = false;
	var _loadingCount = 0;
	
	var _hold = {};//loading or waiting dependencies
	var _defQueue = [];
	var _defined = {};
	var _depReverseMap = {};
	
	function Def(nrmId, config, exports, module, getter, loader) {
		var baseUrl = config.baseUrl;
		this._nrmId = nrmId;
		this._baseUrl = baseUrl;
		this._config = config;
		this._exports = exports;
		this._module = module;
		this._getter = getter;
		this._loader = loader;
		this._fullUrl = _getFullUrl(nrmId, baseUrl);
		_defined[this._fullUrl] = this;
	};
	
	Def.prototype = {
		getDef: function(context) {
			if(this._getter) {
				return this._getter(context);
			} else {
				return this._exports;
			}
		},
		
		getLoader: function() {
			return this._loader;
		},
		
		constructor: Def
	};
	
	new Def('require', _gcfg, {}, {}, function(context) {
		var base = context.base;
		var moduleFullUrl;
		if(base) {
			moduleFullUrl = _getFullUrl(base.nrmId, base.baseUrl);	
		}
		return _makeRequire({config: context.config, moduleFullUrl: moduleFullUrl});
	});
	new Def('exports', _gcfg, {}, {}, function(context) {
		return {};
	});
	new Def('module', _gcfg, {}, {}, function(context) {
		return {};
	});
	new Def('domready', _gcfg, {}, {}, function(context) {
		return {};
	}, (function() {
		var _queue = [];
		var _checking = false;
		var _ready = false;
		
		function _onready() {
			if(_ready) {
				return;
			}
			_ready = true;
			while(_queue.length) {
				(function(args) {
					setTimeout(function() {
						domreadyLoader.apply(null, _getArray(args));
					}, 0);
				})(_queue.shift());
			}
		};
		
		function _onReadyStateChange() {
			if(document.readyState == 'complete') {
				_onready();
			}
		};
		
		function _checkReady() {
			if(_checking || _ready) {
				return;			
			}
			_checking = true;
			if(document.readyState == 'complete') {
				_onready();
			} else if(document.addEventListener) {
				document.addEventListener('DOMContentLoaded', _onready, false);
				window.addEventListener('load', _onready, false);
			} else {
				document.attachEvent('onreadystatechange', _onReadyStateChange);
				window.attachEvent('onload', _onready);
			}
		};		
		
		function domreadyLoader(context, onRequire) {
			if(_ready) {
				onRequire();
			} else {
				_queue.push(arguments);
				_checkReady();
			}
		};
		
		return domreadyLoader;
	})());
	
	function Hold(id, nrmId, config) {
		var baseUrl = config.baseUrl;
		this._id = id;
		this._nrmId = nrmId;
		this._baseUrl = baseUrl;
		this._config = config;
		this._defineCalled = false;
		this._queue = [];
		this._shim = config.shim[_removeIdPrefix(id)];
		this._fullUrl = _getFullUrl(nrmId, baseUrl);
		_hold[this._fullUrl] = this;
	};
	
	Hold.prototype = {
		_getShimExports: function(name) {
			var exports = global;
			name = name.split('.');
			while(exports && name.length) {
				exports = exports[name.shift()];
			}
			return exports;
		},
		
		push: function(onRequire) {
			this._queue.push(onRequire);
		},
		
		defineCall: function() {
			this._defineCalled = true;
		},
		
		isDefineCalled: function() {
			return this._defineCalled;
		},
		
		remove: function() {
			delete _hold[this._fullUrl];
		},
		
		dispatch: function(errCode) {
			while(this._queue.length) {
				(function(callback) {
					setTimeout(function() {
						callback && callback(errCode);
					}, 0);
				})(this._queue.shift());
			}
		},
		
		getConfig: function() {
			return this._config;
		},
		
		getShim: function() {
			return this._shim;
		},
		
		loadShimDeps: function(callback) {
			var nrmId = this._nrmId;
			var config = this._config;
			var shim = this._shim;
			if(shim.deps) {
				_makeRequire({config: config, base: {nrmId: nrmId, baseUrl: this._baseUrl}})(shim.deps, function() {
					callback();
				}, function(code) {
					callback(code);
				});
			} else {
				callback();
			}
		},
		
		shimDefine: function() {
			var hold = this;
			var nrmId = this._nrmId;
			var config = this._config;
			var shim = this._shim;
			var exports;
			if(!shim) {
				return false;
			}
			if(shim.exports) {
				exports = this._getShimExports(shim.exports);
				if(!exports) {
					return false;
				}
			};
			_makeRequire({config: config, base: {nrmId: nrmId, baseUrl: this._baseUrl}})(shim.deps || [], function() {
				var args = _getArray(arguments);
				if(shim.init) {
					exports = shim.init.apply(global, args) || exports;
				}
				new Def(nrmId, config, exports, {});
				hold.dispatch();
				hold.remove();
			}, function(code) {
				hold.dispatch(code);
				hold.remove();
			});
			return true;
		},
		
		constructor: Hold
	};
	
	function _getHold(nrmId, baseUrl) {
		var url = _getFullUrl(nrmId, baseUrl);
		return _hold[url];
	};
	
	function _getDefined(nrmId, baseUrl) {
		var url = _getFullUrl(nrmId, baseUrl);
		return _defined[url];
	};
	
	function _getDepReverseMap(url) {
		var map = _depReverseMap[url] = _depReverseMap[url] || {};
		return map;
	};
	
	function _setDepReverseMap(url, depReverseUrl) {
		var map = _getDepReverseMap(url);
		map[depReverseUrl] = 1;
	};
	
	function _hasCircularDep(depReverseUrl, url) {
		var depMap = _getDepReverseMap(depReverseUrl);
		var p;
		if(url == depReverseUrl || depMap[url]) {
			return true;
		}
		for(p in depMap) {
			if(!_hasOwnProperty(depMap, p)) {
				continue;
			}
			if(_hasCircularDep(p, url)) {
				return true;
			}
		}
		return false;
	};
	
	/**
	 * id start width 'http:', 'https:', '/', or end with '.js' is unnormal
	 */
	function _isUnnormalId(id) {
		return (/^https?:|^\/|.js$/).test(id);
	};
	
	function _removeIdPrefix(id) {
		return id.replace(/^[^#]+?#/, '');
	};
	
	function _normalizeId(id, base, pathMap) {
		var nrmId, a, b, maped;
		if(!id) {
			return id;
		}
		if(_isUnnormalId(id)) {
			return id;
		}
		id = _removeIdPrefix(id);//remove source prefix
		if(base && id.indexOf('./') === 0) {
			nrmId = _getRelativePath(base.nrmId, id);
		} else {
			nrmId = id;
		}
		if(pathMap) {
			a = nrmId.split('/');
			b = [];
			while(a.length) {
				maped = pathMap[a.join('/')];
				if(maped) {
					b.unshift(_trimTailSlash(maped));
					return b.join('/');
				}
				b.unshift(a.pop());
			}
		}
		return nrmId;
	};
	
	function _getOrigin() {
		return location.origin || location.protocol + '//' +  location.host;
	};
	
	function _getRelativePath(base, path) {
		if(path.indexOf('.') !== 0) {
			return path;
		}
		var bArr = base.split('/'),
			pArr = path.split('/'),
			part;
		bArr.pop();
		while(pArr.length) {
			part = pArr.shift();
			if(part == '..') {
				if(bArr.length) {
					part = bArr.pop();
					while(part == '.') {
						part = bArr.pop();
					}
					if(part == '..') {
						bArr.push('..', '..');
					}
				} else {
					bArr.push(part);
				}
			} else if(part != '.') {
				bArr.push(part);
			}
		}
		path = bArr.join('/');
		return path;
	};
	
	function _getFullBaseUrl(url) {
		if(url) {
			if(url.indexOf('://') < 0) {
				if(url.indexOf('/') === 0) {
					url = _getOrigin() + _trimTailSlash(url);
				} else {
					url = _getOrigin() + _getRelativePath(location.path, _trimTailSlash(url));
				}
			} else {
				url = _trimTailSlash(url);
			}
		}
		return url;
	};
	
	function _getFullUrl(nrmId, baseUrl) {
		var url;
		if(_RESERVED_NRM_ID[nrmId] || _isUnnormalId(nrmId)) {
			url = nrmId;
		} else if(nrmId.indexOf('.') === 0) {
			url = _getRelativePath(baseUrl + '/', nrmId) + '.js';
		} else {
			url = baseUrl + '/' + nrmId + '.js';
		}
		return url;
	};
	
	function _getSourceName(id) {
		var m = id.match(/^([^#]+?)#/);
		return m && m[1] || '';
	};
	
	function _extendConfig(props, config, ext) {
		if(!ext) {
			return config;
		}
		ext.baseUrl = _getFullBaseUrl(ext.baseUrl);
		if(ext.baseUrl && config.baseUrl != ext.baseUrl) {
			config = {
				charset: 'utf-8',
				source: {},
				path: {},//match by id removed prefix
				shim: {},//match by id removed prefix
				urlArgs: {//match by id removed prefix
					'*': ''//for all
				},
				waitSeconds: 30
			};
		} else {
			config = _clone(config, true);
		}
		_each(props, function(p) {
			config[p] = typeof ext[p] == 'object' ? _extend(config[p], ext[p]) : ext[p];
		});
		return config;
	};

	function _getUrlArg(id, urlArgs) {
		return urlArgs && (urlArgs[_removeIdPrefix(id)] || urlArgs['*']) || '';
	};
	
	function _endLoad(jsNode, onload, onerror) {
		_loadingCount--;
		if(jsNode.attachEvent && !_isOpera) {
			jsNode.detachEvent('onreadystatechange', onload);
		} else {
			jsNode.removeEventListener('load', onload, false);
			jsNode.removeEventListener('error', onerror, false);
		}
		jsNode.parentNode.removeChild(jsNode);
		if(_loadingCount === 0 && _gcfg.onLoadStart) {
			try {
				_gcfg.onLoadEnd();
			} catch(e) {}
		}
	};
	
	function _checkHoldDefine(hold) {
		if(!hold.isDefineCalled() && !hold.shimDefine()) {
			hold.dispatch(_ERR_CODE.NO_DEFINE);
			hold.remove();
		}
	};
	
	function _doLoad(id, nrmId, config, onRequire, hold) {
		var baseUrl = config.baseUrl;
		var jsNode, urlArg;
		jsNode = document.createElement('script');
		if(jsNode.attachEvent && !_isOpera) {
			_interactiveMode = true;
			jsNode.attachEvent('onreadystatechange', _ieOnload);
		} else {
			jsNode.addEventListener('load', _onload, false);
			jsNode.addEventListener('error', _onerror, false);
		}
		if(config.charset) {
			jsNode.charset = config.charset;
		}
		jsNode.type = 'text/javascript';
		jsNode.async = 'async';
		urlArg = _getUrlArg(id, config.urlArgs);
		jsNode.src = _getFullUrl(nrmId, baseUrl) + (urlArg ? '?' + urlArg : '');
		jsNode.setAttribute('data-nrm-id', nrmId);
		jsNode.setAttribute('data-base-url', baseUrl);
		_head.insertBefore(jsNode, _head.firstChild);
		_loadingCount++;
		if(_loadingCount === 1 && _gcfg.onLoadStart) {
			_gcfg.onLoadStart();
		}
		function _ieOnload() {
			if(jsNode && (jsNode.readyState == 'loaded' || jsNode.readyState == 'complete')) {
				_endLoad(jsNode, _ieOnload);
				jsNode = null;
				_checkHoldDefine(hold);
			}
		};
		function _onload() {
			var def;
			_endLoad(jsNode, _onload, _onerror);
			def = _defQueue.shift();
			while(def) {
				_defineCall(def.id, def.nrmId, def.deps, def.factory, {
					nrmId: nrmId,
					baseUrl: baseUrl
				}, def.config);
				def = _defQueue.shift();
			}
			_checkHoldDefine(hold);
		};
		function _onerror() {
			_endLoad(jsNode, _onload, _onerror);
			hold.dispatch(_ERR_CODE.LOAD_ERROR);
			hold.remove();
		};
	};
	
	function _load(id, nrmId, config, onRequire) {
		var baseUrl = config.baseUrl,
			def = _getDefined(nrmId, baseUrl),
			hold = _getHold(nrmId, baseUrl),
			jsNode, urlArg;
		if(def) {
			onRequire(nrmId, baseUrl);
			return;
		} else if(hold) {
			hold.push(onRequire);
			return;
		}
		hold = new Hold(id, nrmId, config);
		hold.push(onRequire);
		if(hold.getShim()) {
			hold.loadShimDeps(function(errCode) {
				if(errCode) {
					hold.dispatch(errCode);
					hold.remove();
				} else {
					_doLoad(id, nrmId, config, onRequire, hold);
				}
			});
		} else {
			_doLoad(id, nrmId, config, onRequire, hold);
		}
	};
	
	function _dealError(code, errCallback) {
		if(errCallback) {
			errCallback(code);
		} else if(_gcfg.errCallback) {
			_gcfg.errCallback(code);
		} else {
			throw new Error('Load error.');
		}
	};
	
	/**
	 * define
	 */
	function _defineCall(id, nrmId, deps, factory, loadInfo, config) {
		var conf, hold, depMap;
		var baseUrl = loadInfo.baseUrl;
		if(nrmId) {
			hold = _getHold(nrmId, baseUrl);
			if(hold) {
				hold.defineCall();
			} else {//multiple define in a file
				hold = _getHold(loadInfo.nrmId, baseUrl);
				hold = new Hold(id, nrmId, hold.getConfig());
				hold.defineCall();
			}
		} else {
			nrmId = loadInfo.nrmId;
			hold = _getHold(nrmId, baseUrl);
			hold.defineCall();
		}
		conf = _extendConfig(['charset', 'baseUrl', 'source', 'path', 'shim', 'urlArgs'], hold.getConfig(), config);
		_makeRequire({config: conf, base: {nrmId: nrmId, baseUrl: baseUrl}})(deps, function() {
			var exports, module;
			var args = _getArray(arguments);
			exports = deps[1] == 'exports' ? args[1] : {};
			module = deps[2] == 'module' ? args[2] : {};
			if(_isFunction(factory)) {
				exports = factory.apply(null, args) || exports;
			} else {
				exports = factory;
			}
			new Def(nrmId, conf, exports, module);
			hold.dispatch();
			hold.remove();
		}, function(code) {
			hold.dispatch(code);
			hold.remove();
		});
	};
	
	function _makeDefine(context) {
		var config;
		context = context || {};
		context.parentConfig = context.parentConfig || _gcfg;
		config = _extendConfig(['charset', 'baseUrl', 'source', 'path', 'shim', 'urlArgs'], context.parentConfig, context.config);
		function def(id, deps, factory) {
			var nrmId, script;
			if(typeof id != 'string') {
				factory = deps;
				deps = id;
				id = '';
			}
			nrmId = _normalizeId(id, '', config.path);
			if(!_isArray(deps)) {
				factory = deps;
				deps = [];
			}
			if(!deps.length && _isFunction(factory) && factory.length) {
				factory.toString().replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '')//remove comments
					.replace(/[(=;:{}&|]\s*require\(\s*["']([^"'\s]+)["']\s*\)/g, function(m, dep) {//extract dependencies
						deps.push(dep);
					});
				deps = (factory.length === 1? ['require'] : ['require', 'exports', 'moudule']).concat(deps);
			}
			if(_interactiveMode) {
				script = _getInteractiveScript();
				if(script) {
					_defineCall(id, nrmId, deps, factory, {
						nrmId: script.getAttribute('data-nrm-id'),
						baseUrl: script.getAttribute('data-base-url')
					}, config);
				}
			} else {
				_defQueue.push({
					id: id,
					nrmId: nrmId,
					deps: deps,
					factory: factory,
					config: config
				});
			}
			return def;
		};
		def.config = function(conf) {
			return _makeDefine({config: conf, parentConfig: config});
		};
		return def;
	};
	
	define = _makeDefine();
	
	define.config = function(config) {
		return _makeDefine({config: config});
	};
	
	/**
	 * require
	 */
	function _makeRequire(context) {
		var config;
		context = context || {};
		context.parentConfig = context.parentConfig || _gcfg;
		config = _extendConfig(['charset', 'baseUrl', 'source', 'path', 'shim', 'urlArgs'], context.parentConfig, context.config);
		function _getDef(id) {
			var conf, nrmId, def, sourceConf, fullUrl, baseFullUrl;
			if(!id) {
				return {};
			}
			sourceConf = config.source[_getSourceName(id)];
			def = _defined[id];
			if(def) {//reserved
				return {inst: def, load: {loader: def.getLoader(), id: id, nrmId: id, config: config}};
			}
			conf = _extendConfig(['charset', 'baseUrl', 'path', 'shim', 'urlArgs'], config, sourceConf);
			nrmId = _normalizeId(id, context.base, conf.path);
			fullUrl = _getFullUrl(nrmId, conf.baseUrl);
			if(context.base) {
				baseFullUrl = _getFullUrl(context.base.nrmId, context.base.baseUrl);
				_setDepReverseMap(fullUrl, baseFullUrl);
				if(_hasCircularDep(baseFullUrl, fullUrl)) {//cirular dependency
					return {};
				}
			}
			def = _getDefined(nrmId, conf.baseUrl);
			return {inst: def, load: {id: id, nrmId: nrmId, config: conf}};
		};
		function req(deps, callback, errCallback) {
			var over = false;
			var loadList = [];
			var def, count, callArgs, toRef;
			if(typeof deps == 'string') {
				if(arguments.length === 1) {
					def = _getDef(deps)
					return def.inst && def.inst.getDef(context);
				} else {
					throw new Error('Wrong arguments for require.');
				}
			}
			callArgs = new Array(deps.length);
			_each(deps, function(id, i) {
				var def = _getDef(id);
				if(def.load && def.load.loader) {//reserved module loader
					callArgs[i] = def.inst.getDef(context);
					loadList.push(def.load);
				} else if(def.inst) {
					callArgs[i] = def.inst.getDef(context);
				} else if(def.load) {
					loadList.push(def.load);
				} else {
					callArgs[i] = null;
				}
			});
			count = loadList.length;
			if(count) {
				if(!context.base) {
					toRef = setTimeout(function() {
						if(over) {
							return;
						}
						over = true;
						_dealError(_ERR_CODE.TIMEOUT, errCallback);
					}, config.waitSeconds * 1000);
				}
				_each(loadList, function(item, i) {
					var hold;
					if(item.loader) {//reserved module loader
						item.loader(context, onRequire);
						return;
					}
					hold = _getHold(item.nrmId, item.config.baseUrl);
					if(hold) {
						hold.push(onRequire);
					} else {
						_load(item.id, item.nrmId, item.config, onRequire);
					}
				});
			} else {
				callback.apply(null, callArgs);
			}
			function onRequire(errCode) {
				if(over) {
					return;
				}
				if(errCode) {
					over = true;
					clearTimeout(toRef);
					_dealError(errCode, errCallback);
				} else {
					count--;
					if(count <= 0) {
						over = true;
						clearTimeout(toRef);
						if(callback) {
							_each(callArgs, function(arg, i) {
								var def;
								if(typeof arg == 'undefined') {
									arg = loadList.shift();
									def = _getDefined(arg.nrmId, arg.config.baseUrl);
									callArgs[i] = def.getDef(context);
								}
							});
							callback.apply(null, callArgs);
						}
					}
				}
			};
			return req;
		};
		req.config = function(conf) {
			return _makeRequire({config: conf, parentConfig: config});
		};
		req.toUrl = function(url, onlyPath) {
			var moduleFullUrl = context.moduleFullUrl;
			if(moduleFullUrl) {
				url = _getRelativePath(moduleFullUrl, url);
			} else {
				url = _getRelativePath(config.baseUrl + '/', url);
			}
			if(onlyPath) {
				url = url.replace(/^https?:\/\/[^\/]*?\//, '/');
			}
			return url;
		};
		return req;
	};
	
	require = _makeRequire();
	
	require.config = function(config) {
		return _makeRequire({config: config});
	};
	
	require.ERR_CODE = _ERR_CODE;
	
	//debug
	require._gcfg = _gcfg;
	require._hold = _hold;
	require._defQueue = _defQueue;
	require._defined = _defined;
	require._depReverseMap = _depReverseMap;
	require._getRelativePath = _getRelativePath;
})(this);
