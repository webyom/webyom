define('./tooltip.tpl.html', [], function() {
	function $encodeHtml(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, '&#96;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
	};
	return function($data, $opt) {
		$data = $data || {};
		var _$out_= [];
		var $print = function(str) {_$out_.push(str);};
		with($data) {
		_$out_.push('<div data-type="yom-tooltip-inner" class="yom-tooltip-inner"><div data-type="yom-tooltip-content" class="yom-tooltip-content">', content, '</div><div data-type="yom-tooltip-arrow-outer" class="yom-tooltip-arrow-outer"></div><div data-type="yom-tooltip-arrow-inner" class="yom-tooltip-arrow-inner"></div>');
		if(!noCloseBtn) {
		_$out_.push('<span data-type="yom-tooltip-close-btn" class="yom-tooltip-close-btn">\\u00d7</span>');
		}
		_$out_.push('</div>');
		}
		return _$out_.join('');
	};
});

/**
 * @namespace YOM.widget.Tooltip
 */
define(['require', 'exports', 'module', './tooltip.tpl.html'], function(require) {
	var YOM = require('../../core/core-built');
	
	var _ID = 128003;
	var _FX_DURATION = 300;
	var _MIN_CLOSE_TIMEOUT = 1000;
	var _DIRECTION_HASH = {L: 'L', R: 'R', T: 'T', B: 'B'};
	
	var _tmpl = require('./tooltip.tpl.html');
	var _im = new YOM.InstanceManager();
	
	/**
	 * @class
	 * @param {Object} opt
	 * opt.keepAlive - do not remove the tooltip from dom tree after close
	 * opt.zIndex - zIndex of tooltip
	 * opt.content - content of the tooltip
	 * opt.tmpl - customized tmpl
	 * opt.noCloseBtn - set "ture" to hide the close btn
	 * opt.beforeClose - callback function before dialog close, return "false" to cancel the close
	 * opt.focus - the css query string of focus element
	 */
	function Tooltip(opt) {
		opt = opt || {};
		this._opt = opt;
		this._id = _im.add(this);
		this._closed = 1;
		this._closeToRef = null;
		this._fx = opt.fx;
		this._fxDuration = opt.fxDuration || _FX_DURATION;
		this._beforeClose = opt.beforeClose || $empty;
		this._el = YOM(document.body).append(YOM.Element.create('div', {
			'data-type': 'yom-tooltip-wrapper'
		}, {
			position: 'absolute',
			display: 'none'
		}));
		this._el.setHtml((opt.tmpl || _tmpl)({
			id: this._id,
			content: opt.content,
			noCloseBtn: opt.noCloseBtn
		}));
		this._bindEvent();
		this.setZIndex(opt.zIndex);
		YOM.css.load(require.toUrl('./tooltip.css'));
	};
	
	YOM.Class.extend(Tooltip, YOM.Event);
	YOM.Class.genericize(Tooltip, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: Tooltip});
	Tooltip.addObservers({
		popup: new YOM.Observer(),
		close: new YOM.Observer()
	});
	
	Tooltip._im = _im;
	
	Tooltip.getInstanceById = function(id) {
		return _im.get(id);	
	};
	
	Tooltip.each = function(cb, bind) {
		_im.each(cb, bind);
	};
	
	YOM.object.extend(Tooltip.prototype, {
		_bindEvent: function() {
			var opt = this._opt;
			var btns = opt.btns;
			if(!opt.noCloseBtn) {
				this._el.find('[data-type="yom-tooltip-close-btn"]').addEventListener('click', this.close, this);
			}
		},
		
		_closeTimeout: function(timeout) {
			if(!(timeout > 0)) {
				return;
			}
			var self = this;
			this._closeToRef = setTimeout(function() {
				self.close();
			}, Math.max(_MIN_CLOSE_TIMEOUT, timeout));
		},
		
		_show: function(w, h) {
			this._el.setStyle({left: '0px', top: '-9999px', width: w > 0 ? w + 'px' : 'auto', height: h > 0 ? h + 'px' : 'auto'}).show();	
		},
		
		_hide: function() {
			if(this._opt.keepAlive) {
				this._el.hide();	
			} else {
				this._el.remove();
				this._el = null;
			}
		},
		
		focus: function() {
			if(!this._el) {
				return this;
			}
			if(this._opt.focus) {
				var el = this._el.find(this._opt.focus).get();
				if(el) {
					try {
						el.focus();
					} catch(e) {}
				}
			}
			return this;
		},
		
		getId: function() {
			return this._id;	
		},
		
		getZIndex: function() {
			return this._el && this._el.getStyle('z-index');	
		},
		
		setZIndex: function(z) {
			if(!this._el) {
				return this;
			}
			if(!isNaN(z)) {
				this._el.setStyle('z-index', z);
			}
			return this;
		},
		
		getContentHolder: function() {
			return this._el && this._el.find('[data-type="yom-tooltip-content"]').get();
		},
		
		setContent: function(content) {
			var holder = this.getContentHolder();
			if(holder) {
				holder.innerHTML = content;
			}
			return this;
		},
		
		/**
		 * @param {Object} opt
		 * opt.target - the target dom element
		 * opt.pos - the target position object. {x: Number, y: Number}
		 * opt.width - width of tooltip content
		 * opt.height - height of tooltip content
		 * opt.direction - direction of the tooltip. [L | R | T | B]. You'd better give a width when you use "L" direction.
		 */
		_locate: function(opt) {
			opt = opt || {};
			var wrapper = this._el;
			var pos = opt.pos;
			var offset = opt.offset || {};
			offset.L = offset.L || {};
			offset.L.x = offset.L.x || 0;
			offset.L.y = offset.L.y || 0;
			offset.R = offset.R || {};
			offset.R.x = offset.R.x || 0;
			offset.R.y = offset.R.y || 0;
			offset.T = offset.T || {};
			offset.T.x = offset.T.x || 0;
			offset.T.y = offset.T.y || 0;
			offset.B = offset.B || {};
			offset.B.x = offset.B.x || 0;
			offset.B.y = offset.B.y || 0;
			var direction = _DIRECTION_HASH[opt.direction];
			var docSize = YOM.Element.getDocSize();
			var viewRect = YOM.Element.getViewRect();
			var wrapperRect = wrapper.getRect();
			var wrapperResized = false;
			var width, height, target, targetRect, spaceL, spaceR, spaceT, spaceB;
			if(pos) {
				if(!direction) {
					spaceL = pos.x - viewRect.left;
					spaceR = viewRect.right - pos.x;
					spaceT = pos.y - viewRect.top;
					spaceB = viewRect.bottom - pos.y;
					if(spaceL > spaceR) {//left space is bigger
						if(spaceT > spaceB && pos.x + wrapperRect.width + offset.T.x <= viewRect.right && pos.y - wrapperRect.height + offset.T.y >= viewRect.top) {
							direction = 'TT';//fixed
						} else {
							direction = 'L';
						}
					} else {//right space is bigger
						if(spaceT > spaceB && pos.x + wrapperRect.width + offset.T.x <= viewRect.right && pos.y - wrapperRect.height + offset.T.y >= viewRect.top) {
							direction = 'TT';//fixed
						} else {
							direction = 'B';
						}
					}
				}
			} else {
				target = YOM(opt.target).get();
				if(!target) {
					return;
				}
				targetRect = YOM(target).getRect();
				if(direction == 'L') {
					pos = {x: targetRect.left, y: targetRect.top};
				} else if(direction == 'R') {
					pos = {x: targetRect.right, y: targetRect.top};
				} else if(direction == 'T') {
					pos = {x: targetRect.left, y: targetRect.top};
				} else if(direction == 'B') {
					pos = {x: targetRect.left, y: targetRect.bottom};
				} else {
					spaceL = targetRect.left - viewRect.left;
					spaceR = viewRect.right - targetRect.left;
					spaceT = targetRect.top - viewRect.top;
					spaceB = viewRect.bottom - targetRect.bottom;					
					if(spaceL > spaceR) {//left space is bigger
						if(spaceT > spaceB && targetRect.left + wrapperRect.width + offset.T.x <= viewRect.right && targetRect.top - wrapperRect.height + offset.T.y >= viewRect.top) {
							pos = {x: targetRect.left, y: targetRect.top};
							direction = 'TT';//fixed
						} else {
							pos = {x: targetRect.left, y: targetRect.top};
							direction = 'L';
						}
					} else {//right space is bigger
						if(spaceT > spaceB && targetRect.left + wrapperRect.width + offset.T.x <= viewRect.right && targetRect.top - wrapperRect.height + offset.T.y >= viewRect.top) {
							pos = {x: targetRect.left, y: targetRect.top};
							direction = 'TT';//fixed
						} else {
							pos = {x: targetRect.left, y: targetRect.bottom};
							direction = 'B';
						}
					}
				}
			}
			if(!(opt.width > 0) && !(opt.height > 0)) {//adjust wrapper rect if width and height are not specified
				if(direction == 'L') {
					if(pos.x < wrapperRect.width - offset.L.x) {
						wrapper.setStyle({
							width: (pos.x + offset.L.x) + 'px'
						});
						wrapperResized = true;
					}
				} else if(direction == 'T') {
					if(pos.y < wrapperRect.height - offset.T.y) {
						wrapper.setStyle({
							height: (pos.y + offset.T.y) + 'px'
						});
						wrapperResized = true;
					}
				} else if(direction == 'R' || direction == 'B') {
					if(pos.x + wrapperRect.width + offset[direction].x > docSize.width) {
						wrapper.setStyle({
							width: (docSize.width - pos.x - offset[direction].x) + 'px'
						});
						wrapperResized = true;
					}
				}
				if(wrapperResized) {
					wrapperRect = wrapper.getRect();
				}
			}
			width = opt.width > 0 ? opt.width : wrapperRect.width;
			height = opt.height > 0 ? opt.height : wrapperRect.height;
			if(direction == 'L') {
				wrapper.setStyle({
					width: width + 'px',
					height: height + 'px',
					left: (pos.x - width) + offset.L.x + 'px',
					top: pos.y + offset.L.y + 'px'
				});
			} else if(direction == 'R') {
				wrapper.setStyle({
					width: width + 'px',
					height: height + 'px',
					left: pos.x + offset.R.x + 'px',
					top: pos.y + offset.R.y + 'px'
				});
			} else if(direction == 'T' || direction == 'TT') {
				direction = 'T';
				wrapper.setStyle({
					width: width + 'px',
					height: height + 'px',
					left: pos.x + offset.T.x + 'px',
					top: (pos.y - height) + offset.T.y + 'px'
				});
			} else {
				direction = 'B';
				wrapper.setStyle({
					width: width + 'px',
					height: height + 'px',
					left: pos.x + offset.B.x + 'px',
					top: pos.y + offset.B.y + 'px'
				});
			}
			wrapper.get().className = 'yom-tooltip-' + direction;
			this._width = width;
			this._height = height;
		},

		/**
		 * @param {Object} opt
		 * opt.fx - indicate use tween effect to show or hide, "fade" value indicate use fade effect
		 * opt.fxDuration - duration of tween effect
		 * opt.closeTimeout - auto close when timeout
		 */
		popup: function(opt) {
			opt = opt || {};
			var self = this;
			var thisOpt = this._opt;
			var fx = this._fx = opt.fx;
			var fxDuration = this._fxDuration =  opt.fxDuration || _FX_DURATION;
			if(!this._el) {
				return this;
			}
			clearTimeout(this._closeToRef);
			this._closed = 0;
			this._show(opt.width, opt.height);
			this._locate(opt);
			if(fx == 'fade') {
				this._el.fadeIn(fxDuration, function() {
					self.focus();
				});
			} else if(fx == 'slide' && this._height > 0) {
				this._el.slideDown(fxDuration, function() {
					self.focus();
				});
			} else if(fx && this._width > 0 && this._height > 0) {
				this._el.fxShow(fxDuration, function() {
					self.focus();
				});
			} else {
				this.focus();
			}
			this._closeTimeout(opt.closeTimeout);
			Tooltip.dispatchEvent(Tooltip.createEvent('popup', {tooltipId: this._id, opt: thisOpt}));
			return this;	
		},
		
		/**
		 * @param {Object} opt
		 * opt.fx - indicate use tween effect to show or hide, "fade" value indicate use fade effect
		 * opt.fxDuration - duration of tween effect
		 */
		close: function(opt) {
			opt = opt || {};
			var fx = opt.fx != undefined ? opt.fx : this._fx;
			var fxDuration = opt.fxDuration || this._fxDuration || _FX_DURATION;
			if(this.isClosed() || !this._el) {
				return this;
			}
			try {
				if(this._beforeClose.call(this) === false) {
					return this;
				}
			} catch(e) {
				if(YOM.config.debug) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1));
				}
			}
			clearTimeout(this._closeToRef);
			var self = this;
			if(fx == 'fade') {
				this._el.fadeOut(fxDuration, function() {
					self._hide();
				});
			} else if(fx == 'slide' && this._height > 0) {
				this._el.slideUp(fxDuration, function() {
					self._hide();
				});
			} else if(fx && this._width > 0 && this._height > 0) {
				this._el.fxHide(fxDuration, function() {
					self._hide();
				});
			} else {
				this._hide();
			}
			if(!this._opt.keepAlive) {
				_im.remove(this._id);
			}
			this._closed = 1;
			Tooltip.dispatchEvent(Tooltip.createEvent('close', {tooltipId: this._id, opt: this._opt}));
			return this;
		},
		
		isClosed: function() {
			return !!this._closed;
		}
	});
	
	return Tooltip;
});
