/**
 * @namespace YOM.widget.Tooltip
 */
define(function(require) {
	var YOM = require('yom/core-pkg');
	
	var _ID = 128003;
	var _FX_DURATION = 300;
	var _MIN_CLOSE_TIMEOUT = 1000;
	var _DIRECTION_HASH = {L: 'L', R: 'R', T: 'T', B: 'B'};
	var _TMPL = [
		'<div data-type="yom-tooltip-outer" class="yom-tooltip-outer">',
			'<div data-type="yom-tooltip-inner" class="yom-tooltip-inner">',
				'<span data-type="yom-tooltip-arrow" class="yom-tooltip-arrow-tl">&nbsp;</span>',
				'<%if(!noCloseBtn) {%>',
					'<span data-type="yom-tooltip-close-btn" class="yom-tooltip-close-btn">X</span>',
				'<%}%>',
				'<div data-type="yom-tooltip-content" class="yom-tooltip-content"><%=content%></div>',
			'</div>',
		'</div>'
	].join('');
	
	var _im = new YOM.InstanceManager();
	
	/**
	 * @class
	 * @param {Object} opt
	 * opt.keepAlive - do not remove the tooltip from dom tree after close
	 * opt.zIndex - zIndex of tooltip
	 * opt.content - content of the tooltip
	 * opt.tmpl - customized tmpl
	 * opt.fx - indicate use tween effect to show or hide, "fade" value indicate use fade effect
	 * opt.fxDuration - duration of tween effect
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
		this._el.setHtml(YOM.tmpl.render(opt.tmpl || _TMPL, {
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
	
	$extend(Tooltip.prototype, {
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
		
		_show: function() {
			this._el.setStyle({left: '0px', top: '-9999px', width: 'auto', height: 'auto'}).show();	
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
			var width;
			var height;
			var pos = opt.pos;
			var offset = opt.offset || {};
			offset.L = offset.L || {};
			offset.R = offset.R || {};
			offset.T = offset.T || {};
			offset.B = offset.B || {};
			var direction = _DIRECTION_HASH[opt.direction];
			var docSize = YOM.Element.getDocSize();
			var viewRect = YOM.Element.getViewRect();
			var wrapperRect = wrapper.getRect();
			var target;
			var targetRect;
			if(pos) {
				if(!direction) {
					if(docSize.width - pos.x < wrapperRect.width + Math.max(offset.T.x || 0, offset.B.x || 0) && pos.x > wrapperRect.width - (offset.L.x || 0)) {
						direction = 'L';
						
					} else if(viewRect.bottom - pos.y < pos.y - viewRect.top) {
						direction = 'TT';
					} else {
						direction = 'B';
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
					if(docSize.width - targetRect.left < wrapperRect.width + Math.max(offset.T.x || 0, offset.B.x || 0) && targetRect.left > wrapperRect.width - (offset.L.x || 0)) {
						pos = {x: targetRect.left, y: targetRect.top};
						direction = 'L';
						
					} else if(viewRect.bottom - targetRect.bottom < targetRect.top - viewRect.top) {
						pos = {x: targetRect.left, y: targetRect.top};
						direction = 'TT';
					} else {
						pos = {x: targetRect.left, y: targetRect.bottom};
						direction = 'B';
					}
				}
			}
			if(direction == 'L' && !(opt.width > 0)) {
				width = Math.min(pos.x + (offset.L.x || 0), wrapperRect.width);
			} else if(direction == 'TT' && !(opt.height > 0)) {
				width = Math.min(docSize.width - pos.x - (offset.T.x || 0), wrapperRect.width);
				wrapper.setStyle({
					width: width + 'px'
				});
				wrapperRect = wrapper.getRect();
				if(pos.y + (offset.T.y || 0) < wrapperRect.height) {
					direction = 'B';
					if(targetRect) {
						pos = {x: targetRect.left, y: targetRect.bottom};
					}
				}
			}
			width = width || (opt.width > 0 ? opt.width : wrapperRect.width);
			height = height || (opt.height > 0 ? opt.height : wrapperRect.height);
			wrapper.setStyle({
				width: width + 'px',
				height: height + 'px'
			});
			var arrow = wrapper.find('[data-type="yom-tooltip-arrow"]').get();
			if(direction == 'L') {
				wrapper.setStyle({
					left: (pos.x - width) + (offset.L.x || 0) + 'px',
					top: pos.y + (offset.L.y || 0) + 'px'
				});
				arrow.className = 'yom-tooltip-arrow-rt';
			} else if(direction == 'R') {
				wrapper.setStyle({
					left: pos.x + (offset.R.x || 0) + 'px',
					top: pos.y + (offset.R.y || 0) + 'px'
				});
				arrow.className = 'yom-tooltip-arrow-lt';
			} else if(direction == 'T' || direction == 'TT') {
				wrapper.setStyle({
					left: pos.x + (offset.T.x || 0) + 'px',
					top: (pos.y - height) + (offset.T.y || 0) + 'px'
				});
				arrow.className = 'yom-tooltip-arrow-bl';
			} else {
				wrapper.setStyle({
					left: pos.x + (offset.B.x || 0) + 'px',
					top: pos.y + (offset.B.y || 0) + 'px'
				});
				arrow.className = 'yom-tooltip-arrow-tl';
			}
			this._width = width;
			this._height = height;
		},

		/**
		 * @param {Object} opt
		 * opt.closeTimeout - auto close when timeout
		 */
		popup: function(opt) {
			opt = opt || {};
			var self = this;
			var thisOpt = this._opt;
			if(!this._el) {
				return this;
			}
			clearTimeout(this._closeToRef);
			this._closed = 0;
			this._show();
			this._locate(opt);
			if(this._fx == 'fade') {
				this._el.fadeIn(this._fxDuration, function() {
					self.focus();
				});
			} else if(this._fx == 'slide' && this._height > 0) {
				this._el.slideDown(this._fxDuration, function() {
					self.focus();
				});
			} else if(this._fx && this._width > 0 && this._height > 0) {
				this._el.fxShow(this._fxDuration, function() {
					self.focus();
				});
			} else {
				this.focus();
			}
			this._closeTimeout(opt.closeTimeout);
			Tooltip.dispatchEvent(Tooltip.createEvent('popup', {tooltipId: this._id, opt: thisOpt}));
			return this;	
		},
		
		close: function() {
			if(this.isClosed() || !this._el) {
				return this;
			}
			try {
				if(this._beforeClose.call(this) === false) {
					return this;
				}
			} catch(e) {
				if(YOM.config.debugMode) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1));
				}
			}
			clearTimeout(this._closeToRef);
			var self = this;
			if(this._fx == 'fade') {
				this._el.fadeOut(this._fxDuration, function() {
					self._hide();
				});
			} else if(this._fx == 'slide' && this._height > 0) {
				this._el.slideUp(this._fxDuration, function() {
					self._hide();
				});
			} else if(this._fx && this._width > 0 && this._height > 0) {
				this._el.fxHide(this._fxDuration, function() {
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
