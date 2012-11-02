/**
 * YOM module define and require lib 1.0
 * Inspired by RequireJS AMD spec
 * Copyright (c) 2012 Gary Wang, webyom@gmail.com http://webyom.org
 * Under the MIT license
 * https://github.com/webyom/yom
 */
var define, require;

;(function(global) {
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
	
	function _clone(obj, deep, _level) {
		var res = obj;
		deep = deep || 0;
		_level = _level || 0;
		if(_level > deep) {
			return res;
		}
		if(typeof obj == 'object' && obj) {
			if(_isArray(obj)) {
				res = [];
				_each(obj, function(item) {
					res.push(item);
				});
			} else {
				res = {};
				for(var p in obj) {
					if(_hasOwnProperty(obj, p)) {
						res[p] = deep ? _clone(obj[p], deep, ++_level) : obj[p];
					}
				}
			}
		}
		return res;
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
		global: 1,
		domReady: 1
	};
	var _ERR_CODE = {
		DEFAULT: 1,
		TIMEOUT: 2,
		LOAD_ERROR: 3,
		NO_DEFINE: 4
	};
	
	var _gcfg = _extendConfig(['debug', 'charset', 'baseUrl', 'source', 'path', 'shim', 'urlArgs', 'errCallback', 'onLoadStart', 'onLoadEnd', 'waitSeconds'], {
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
	}, require);//global config
	_gcfg.baseUrl = _getFullBaseUrl(_gcfg.baseUrl);
	_gcfg.debug = !!_gcfg.debug || location.href.indexOf('yom-debug=1') > 0;
	var _interactiveMode = false;
	var _loadingCount = 0;
	
	var _hold = {};//loading or waiting dependencies
	var _defQueue = [];
	var _defined = {};
	var _plugin = {};
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
	new Def('global', _gcfg, global, {});
	new Def('domReady', _gcfg, {}, {}, function(context) {
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
				domReadyLoader.apply(null, _getArray(_queue.shift()));
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
		
		function domReadyLoader(context, onRequire) {
			if(_ready) {
				onRequire(0);
			} else {
				_queue.push(arguments);
				_checkReady();
			}
		};
		
		return domReadyLoader;
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
		
		dispatch: function(errCode, opt) {
			var callback;
			while(this._queue.length) {
				callback = this._queue.shift();
				if(callback) {
					callback(errCode, opt || {url: this._fullUrl});
				}
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
				hold.dispatch(0);
				hold.remove();
			}, function(code, opt) {
				hold.dispatch(code, opt);
				hold.remove();
			});
			return true;
		},
		
		constructor: Hold
	};
	
	function Plugin(name) {
		this._name = name;
		_plugin[name] = this;
	};
	
	Plugin.prototype = {
		_paramsToken: '@',
		
		_getResource: function(id) {
			var res = _removePluginPrefix(id).split(this._paramsToken);
			return res.slice(0, res.length - 1).join(this._paramsToken);
		},
		
		_getParams: function(id) {
			var params = {};
			var i, item;
			var tmp = id.split(this._paramsToken);
			if(tmp.length < 2) {
				return params;
			}
			tmp = tmp.pop().split('&');
			for(i = 0; i < tmp.length; i++) {
				item = tmp[i].split('=');
				params[item[0]] = item[1];
			}
			return params;
		},
		
		require: function(id, config, callback, errCallback) {
			if(callback) {
				callback(this);
			}
			return this;
		},
		
		constructor: Plugin
	};
	
	function _getHold(nrmId, baseUrl) {
		var url = _getFullUrl(nrmId, baseUrl);
		return _hold[url];
	};
	
	function _getDefined(nrmId, baseUrl) {
		var url = _getFullUrl(nrmId, baseUrl);
		return _defined[url];
	};
	
	function _getPlugin(pluginName) {
		return _plugin[pluginName];
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
		return id.replace(/^([a-zA-Z0-9_\-]+?!)?([a-zA-Z0-9_\-]+?#)?/, '');
	};
	
	function _removePluginPrefix(id) {
		return id.replace(/^[a-zA-Z0-9_\-]+?!/, '');
	};
	
	function _getSourceName(id) {
		var m = id.match(/^([^#]+?)#/);
		return m && m[1] || '';
	};
	
	function _getPluginName(id) {
		var m = id.match(/^([^!]+?)!/);
		return m && m[1] || '';
	};
	
	function _normalizeId(id, base, pathMap) {
		var nrmId, a, b, maped;
		if(!id) {
			return id;
		}
		id = _removeIdPrefix(id);//remove source or plugin prefix
		if(_isUnnormalId(id)) {
			return id;
		}
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
	
	function _extendConfig(props, config, ext) {
		if(!config) {
			return ext;
		} else if(!ext || config == ext) {
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
				errCallback: null,
				onLoadStart: null,
				onLoadEnd: null,
				waitSeconds: 30
			};
		} else {
			config = _clone(config, 1);
		}
		_each(props, function(p) {
			config[p] = typeof config[p] == 'object' && typeof ext[p] == 'object' ? _extend(config[p], ext[p]) : 
					typeof ext[p] == 'undefined' ? config[p] : ext[p];
		});
		return config;
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

	function _getUrlArg(id, urlArgs) {
		return urlArgs && (urlArgs[_removeIdPrefix(id)] || urlArgs['*']) || '';
	};

	function _getCharset(id, charset) {
		if(typeof charset == 'string') {
			return charset;
		} else {
			return charset && (charset[_removeIdPrefix(id)] || charset['*']) || '';
		}
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
	
	function _processDefQueue(nrmId, baseUrl) {
		var def = _defQueue.shift();
		while(def) {
			_defineCall(def.id, def.nrmId, def.deps, def.factory, {
				nrmId: nrmId || '',
				baseUrl: baseUrl || ''
			}, def.config);
			def = _defQueue.shift();
		}
	};
	
	function _doLoad(id, nrmId, config, onRequire, hold) {
		var baseUrl = config.baseUrl;
		var charset = _getCharset(id, config.charset);
		var jsNode, urlArg;
		jsNode = document.createElement('script');
		if(jsNode.attachEvent && !_isOpera) {
			_interactiveMode = true;
			jsNode.attachEvent('onreadystatechange', _ieOnload);
		} else {
			jsNode.addEventListener('load', _onload, false);
			jsNode.addEventListener('error', _onerror, false);
		}
		if(charset) {
			jsNode.charset = charset;
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
			_processDefQueue(nrmId, baseUrl);
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
			onRequire(0);
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
	
	function _dealError(code, opt, errCallback) {
		opt = opt || {};
		if(errCallback) {
			errCallback(code, opt);
		} else if(_gcfg.errCallback) {
			_gcfg.errCallback(code, opt);
		} else {
			throw new Error('Load error.');
		}
	};
	
	function _loadPlugin(pluginName, id, config, onRequire) {
		require(['require-plugin/' + pluginName], function(pluginDef) {
			var plugin = _plugin[pluginName];
			if(!plugin) {
				if(pluginDef.factory) {
					plugin = _plugin[pluginName] = pluginDef.factory(Plugin);
				} else {
					plugin = _plugin[pluginName] = _extend(new Plugin(pluginName), pluginDef);
				}
			}
			plugin.require(id, config, function(res) {
				onRequire(0);
			}, function(errCode, opt) {
				onRequire(errCode, opt);
			});
		}, function(errCode, opt) {
			onRequire(errCode, opt);
		});
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
				hold = new Hold(id, nrmId, hold && hold.getConfig() || config);
				hold.defineCall();
			}
		} else {//anonymous define
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
			hold.dispatch(0);
			hold.remove();
		}, function(code, opt) {
			hold.dispatch(code, opt);
			hold.remove();
		});
	};
	
	function _makeDefine(context) {
		var config;
		context = context || {};
		context.parentConfig = context.parentConfig || _gcfg;
		config = _extendConfig(['charset', 'baseUrl', 'source', 'path', 'shim', 'urlArgs'], context.parentConfig, context.config);
		function def(id, deps, factory) {
			var nrmId, script, factoryStr, reqFnName;
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
				factoryStr = factory.toString();
				reqFnName = factoryStr.match(/^function[^\(]*\(([^\)]+)\)/) || ['', 'require'];
				reqFnName = (reqFnName[1].split(',')[0]).replace(/\s/g, '');
				factoryStr.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/mg, '')//remove comments
					.replace(new RegExp('[(=;:{}&|]\\s*' + reqFnName + '\\(\\s*["\']([^"\'\\s]+)["\']\\s*\\)', 'g'), function(m, dep) {//extract dependencies
						deps.push(dep);
					});
				deps = (factory.length === 1? ['require'] : ['require', 'exports', 'module']).concat(deps);
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
	
	/**
	 * require
	 */
	function _makeRequire(context) {
		var config;
		context = context || {};
		context.parentConfig = context.parentConfig || _gcfg;
		config = _extendConfig(['charset', 'baseUrl', 'source', 'path', 'shim', 'urlArgs'], context.parentConfig, context.config);
		function _getDef(id) {
			var conf, nrmId, def, pluginName, sourceConf, fullUrl, baseFullUrl, loader;
			if(!id) {
				return {};
			}
			pluginName = _getPluginName(id);
			if(pluginName) {
				return {plugin: _getPlugin(pluginName), load: {pluginName: pluginName, id: id, nrmId: id, config: config}};
			}
			sourceConf = config.source[_getSourceName(id)];
			def = _defined[id];
			if(def) {//reserved
				loader = def.getLoader();
				if(loader) {
					return {inst: def, load: {loader: loader, id: id, nrmId: id, config: config}};
				} else {
					return {inst: def};
				}
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
			if(def) {
				return {inst: def};
			} else {
				return {load: {id: id, nrmId: nrmId, config: conf}};
			}
		};
		function req(deps, callback, errCallback) {
			var over = false;
			var loadList = [];
			var def, count, callArgs, toRef;
			if(typeof deps == 'string') {
				if(arguments.length === 1) {
					def = _getDef(deps)
					if(def.plugin) {
						return def.plugin.require(deps, config);
					} else {
						return def.inst && def.inst.getDef(context);
					}
				} else {
					throw new Error('Wrong arguments for require.');
				}
			}
			callArgs = new Array(deps.length);
			_each(deps, function(id, i) {
				var def = _getDef(id);
				if(def.load) {
					loadList.push(def.load);
				} else if(def.inst) {
					callArgs[i] = def.inst.getDef(context);
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
					if(item.pluginName) {//plugin
						_loadPlugin(item.pluginName, item.id, item.config, onRequire);
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
			function onRequire(errCode, opt) {
				if(over) {
					return;
				}
				if(errCode) {
					over = true;
					clearTimeout(toRef);
					if(context.base) {
						_dealError(errCode, opt, errCallback);
					} else {
						try {
							_dealError(errCode, opt, errCallback);
						} catch(e) {
							if(_gcfg.debug) {
								throw e;
							}
						}
					}
				} else {
					count--;
					if(count <= 0) {
						over = true;
						clearTimeout(toRef);
						if(callback) {
							_each(callArgs, function(arg, i) {
								var def, plugin;
								if(typeof arg == 'undefined') {
									arg = loadList.shift();
									if(arg.pluginName) {//plugin
										plugin = _getPlugin(arg.pluginName);
										callArgs[i] = plugin.require(arg.id, config);
									} else {
										def = _getDefined(arg.nrmId, arg.config.baseUrl);
										callArgs[i] = def.getDef(context);
									}
								}
							});
							if(context.base) {
								callback.apply(null, callArgs);
							} else {
								try {
									callback.apply(null, callArgs);
								} catch(e) {
									if(_gcfg.debug) {
										throw e;
									}
								}
							}
						}
					}
				}
			};
			return req;
		};
		req.config = function(conf) {
			return _makeRequire({config: conf, parentConfig: config});
		};
		req.getConfig = function(conf) {
			return config;
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
		req.ERR_CODE = _ERR_CODE;
		return req;
	};
	
	require = _makeRequire();
	
	require._processDefQueue = _processDefQueue;//for modules built with require.js
	
	//debug
	require._gcfg = _gcfg;
	require._defQueue = _defQueue;
	require._hold = _hold;
	require._defined = _defined;
	require._plugin = _plugin;
	require._depReverseMap = _depReverseMap;
})(this);
