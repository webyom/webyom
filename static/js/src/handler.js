/**
 * @namespace $$.Handler
 */
$$.Handler = (function() {
	var _ID = 204;
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
		opt = opt || {};
		this._modKeyInfoHash = opt.modKeyInfoHash || {};
		this._defaultModkey = opt.defaultModkey || '';
		this._markPrefix = opt.markPrefix || '';
		this._prevMark = '';
		this._curMark = '';
		this._prevModInfo = null;
		this._curModInfo = null;
		this._reqInfo = null;
		this.mod = {};
		this._unloaded = false;
		this._name = modName;
		this._parent = parent;
		this._parent.mod[this._name] = this;
		this._bound = {
			beforeunloadmodHook: $bind(this, this._beforeunloadmodHook),
			loadmodHook: $bind(this, this._loadmodHook)
		};
		if(this._name != 'ROOT') {
			this._parent.addEventListener('beforeunloadmod', this._bound.beforeunloadmodHook);
			this._parent.addEventListener('loadmod', this._bound.loadmodHook);
		}
		this._id = $getUniqueId();
	};
	
	$.Class.extend(Handler, $.Event);
	
	$extend(Handler.prototype, {
		_beforeunloadmodHook: function(e) {
			return this.dispatchEvent(this.createEvent('beforeunloadmod', {
				originMark: this._curMark,
				targetMark: '',
				originMod: $.object.clone(this._curModInfo, true),
				targetMod: $.object.clone(e.targetMod, true)
			}));
		},
		
		_loadmodHook: function(e) {
			if(e.originMod && this._reqInfo && e.originMod.name == this._reqInfo.modInfo.name && e.targetMod.name != this._reqInfo.modInfo.name) {
				this.dispatchEvent(this.createEvent('loadmod', {
					originMark: this._curMark,
					targetMark: '',
					originMod: $.object.clone(this._curModInfo, true),
					targetMod: $.object.clone(e.targetMod, true)
				}));
				if(this._unload()) {
					this._parent.removeEventListener('beforeunloadmod', this._bound.beforeunloadmodHook);
					this._parent.removeEventListener('loadmod', this._bound.loadmodHook);
				}
			}
		},
		
		_unload: function() {
			this._parent.mod[this._name] = null;
			this._unloaded = true;
			return this._unloaded;
		},
	
		_loadMod: function(subReqInfo) {
			var self = this;
			var modInfo = subReqInfo.modInfo;
			var modName = modInfo.name;
			if(modInfo.url) {
				$.js.require(modInfo.url, function(ret) {
					if(ret == $.JsLoader.RET.ABORTED) {
						return;
					} else if(ret != $.JsLoader.RET.SUCC) {
						$$alert(
						      'Code: ' + ret + '\n' +
						      'Message: Failed to load module ' + modName
						);
						return;
					}
					self.dispatchEvent(self.createEvent('loadmod', {
						originMark: self._prevMark,
						targetMark: self._curMark,
						originMod: $.object.clone(self._prevModInfo, true),
						targetMod: $.object.clone(modInfo, true)
					}));
					self.mod[modName].handle(subReqInfo.mark, subReqInfo.fullMark, subReqInfo);
				});
			} else if(modInfo.handler) {
				modInfo.handler.handle(subReqInfo.mark, subReqInfo.fullMark, subReqInfo);
			}
		},
		
		_getSubReqInfo: function(mark, fullMark) {
			var params = mark.replace(new RegExp(('^' + this._markPrefix).replace('/', '\\/')), '').split('/'),
				modKey = params[0],
				subMark = params.slice(1).join('/'),
				modInfo = this._modKeyInfoHash[modKey];
			return {
				mark: subMark,
				fullMark: fullMark,
				modInfo: modInfo
			};
		},
		
		getCurrentMark: function() {
			return this._curMark;
		},
		
		getCurrentModInfo: function() {
			return this._curModInfo;
		},
		
		isCurrentHandler: function() {
			var modInfo = this._parent.getCurrentModInfo();
			return modInfo && modInfo.name == this._name;
		},
		
		error: function(e, modName) {
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
		},
		
		abort: function() {
			$.JsLoader.abortAll(this._id);
			$.Xhr.abortAll(this._id);
		},
		
		handle: function(mark, fullMark, reqInfo) {
			var self = this;
			var rawMark = mark;
			fullMark = fullMark || mark;
			mark = mark || (this._markPrefix + this._defaultModkey);
			if(this._markPrefix && mark.indexOf(this._markPrefix) !== 0) {
				return;
			}
			var subReqInfo = this._getSubReqInfo(mark, fullMark);
			if(!subReqInfo.modInfo) {
				$$alert('Sorry, can not find the page you requested.');
				return 1;
			}
			if(this.dispatchEvent(this.createEvent('beforeunloadmod', {
				originMark: this._curMark,
				targetMark: mark,
				originMod: $.object.clone(this._curModInfo, true),
				targetMod: $.object.clone(subReqInfo.modInfo, true)
			})) === false) {
				return 2;
			}
			/*
			try {
				this.mod[this._curModInfo.name].abort();
			} catch(e) {}
			*/
			this._prevMark = this._curMark;
			this._curMark = mark;
			this._prevModInfo = this._curModInfo;
			this._curModInfo = subReqInfo.modInfo;
			this._reqInfo = reqInfo;
			setTimeout(function() {
				self._loadMod(subReqInfo);
			}, 300);
			return 0;
		}
	});
	
	return Handler;
})();

(function() {
	var _MARK_PREFIX = $$.config.get('MARK_PREFIX');
	var _OPTION = _getOption();
	
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
	
	var _jumpCount = 0;
	function jump(mark) {
		if(_jumpCount++ < 10000 || $.history.ajax.needFrame()) {
			handler.handle(mark);
		} else {
			if($.history.isSupportHistoryState) {
				location.href = '/' + mark;
			} else {
				location.href = '/?' + $now() + '#!' + mark;
			}
		}
	};
	
	var handler = $extend(new $$.Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, 'ROOT', $$, {
		modKeyInfoHash: $$.config.get('MOD_KEY_INFO_HASH'),
		defaultModkey: $$.config.get('DEFAULT_MOD_KEY'),
		markPrefix: _MARK_PREFIX
	}), {
		_ID: 205,
		jump: jump
	});
	
	(function() {
		if(_OPTION['console'] == 'on') {
			$.console.turnOn();
		}
		
		var pathName = location.pathname.replace(/^\//, '');
		var hash = location.hash.replace(/^#!\/?/, '');
		var pathNameReqInfo = handler._getSubReqInfo(pathName);
		var hashReqInfo = handler._getSubReqInfo(hash);
		if($.history.isSupportHistoryState) {
			if(!pathName) {
				if(hashReqInfo.modInfo) {
					history.replaceState(null, document.title, '/' + hash);
				}
			} else if(!pathNameReqInfo.modInfo && hashReqInfo.modInfo) {
				history.replaceState(null, document.title, '/' + hash);
			}
		} else if(!hashReqInfo.modInfo && pathNameReqInfo.modInfo) {
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
				if(pathName == handler.getCurrentMark() && hash) {
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
		
		$.history.ajax.setListener(handler.handle, handler);
		$.history.ajax.init({cacheSize: 1000});
	})();
})();
