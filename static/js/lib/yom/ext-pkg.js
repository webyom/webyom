/**
 * @class YOM.Chunker
 */
define('./chunker', ['./core-pkg'], function(YOM) {
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
 * @namespace YOM.console
 */
define('./console', ['./core-pkg', './chunker'], function(YOM, Chunker) {
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
					'<input id="yomConsoleInputBox" type="text" style="width: 458px; border: none; font-family: Courier New, Courier, monospace;" onkeyup="if(event.keyCode === 13) {require(\'yom/ext-pkg\').console.eval(this.value); return false;}" ondblclick="require(\'yom/ext-pkg\').console.eval(this.value); return false;" />',
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
		_chunker = _chunker || new Chunker(_log, {interval2: 1000});
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
 * @namespace
 */
define(function(require) {
	var ext = {
		'Chunker': require('./chunker'),
		'console': require('./console')
	};
	
	return ext;
});
