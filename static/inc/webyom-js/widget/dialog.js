/**
 * @namespace YOM.widget.Dialog
 */
YOM.widget.addModule('Dialog', function(YOM) {
	var _ID = 128002;
	var _INIT_WIDTH = 60;
	var _INIT_HEIGHT = 40;
	var _MIN_WIDTH = 60;
	var _MIN_HEIGHT = 40;
	var _DEFAULT_WIDTH = 300;
	var _DEFAULT_HEIGHT = 200;
	var _FX_DURATION = 300;
	var _MIN_CLOSE_TIMEOUT = 1000;
	var _TMPL = [
		'<%if(noBorder && src) {%>',
			'<iframe data-type="yom-dialog-frame" style="width: 100%; height: 100%;" frameborder="0" scrolling="no" allowtransparency="yes" src="<%=YOM.util.appendQueryString(src, "dialogId=" + id, true)%>"></iframe>',
		'<%} else {%>',
			'<div data-type="yom-dialog-inner" class="yom-dialog-inner" style="width: 100%; height: 100%; padding: 0; margin: 0; border: none; overflow: hidden;">',
				'<%if(title) {%>',
					'<div data-type="yom-dialog-title" class="yom-dialog-title" style="overflow: hidden; <%=fixed ? "cursor: default;" : ""%>">',
						'<h3><%=title%></h3>',
						'<button class="yom-dialog-title-close-btn" title="Close">x</button>',
					'</div>',
				'<%}%>',
				'<%if(src) {%>',
					'<iframe data-type="yom-dialog-frame" style="width: 100%; display: block;" frameborder="0" scrolling="no" allowtransparency="yes" src="<%=YOM.util.appendQueryString(src, "dialogId=" + id, true)%>"></iframe>',
				'<%} else {%>',
					'<div data-type="yom-dialog-content" class="yom-dialog-content" style="padding: <%=contentPadding || 0%>px; margin: 0; border: none; overflow: hidden;">',
						'<%=content%>',
					'</div>',
				'<%}%>',
				'<%if(btns || tips) {%>',
					'<div data-type="yom-dialog-footer" class="yom-dialog-footer" style="overflow: hidden;">',
						'<%if(tips) {%>',
							'<div data-type="yom-dialog-tips" class="yom-dialog-tips">',
								'<%=tips%>',
							'</div>',
						'<%}%>',
						'<%if(btns) {%>',
							'<div data-type="yom-dialog-btns" class="yom-dialog-btns">',
								'<%for(var i = 0, l = btns.length; i < l; i++) {',
									'var btn = btns[i];%>',
									'<button class="<%=btn.className%>" title="<%=btn.title || btn.text%>"><%=btn.text%></button>',
								'<%}%>',
							'</div>',
						'<%}%>',
					'</div>',
				'<%}%>',
			'</div>',
		'<%}%>'
	].join('');
	
	var _im = new YOM.InstanceManager();
	
	/**
	 * @class
	 * @param {Object} opt
	 * opt.width - width of dialog content
	 * opt.height - height of dialog content
	 * opt.title - title of the dialog
	 * opt.content - content of the dialog
	 * opt.contentPadding - padding of content
	 * opt.src - url of the page to display in dialog content, the "content" option will not effect while "src" option was set
	 * opt.fx - indicate use tween effect to show or hide, "fade" value indicate use fade effect
	 * opt.fxDuration - duration of tween effect
	 * opt.beforeClose - callback function before dialog close, return "false" to cancel the close
	 * opt.noBorder - when "src" and this option were set, the dialog just use the src page to display the apperance
	 * opt.dragHandles - the handles of draggable dialog, the title area is the default handle
	 * opt.fixed - can not be dragged while this option was set
	 * opt.closeTimeout - auto close when timeout
	 * opt.tips - tips text displayed, you can use tips to display close countdown while "closeTimeout" option was set. e.g.'{{s}} seconds to close. {{c:cancel}}'
	 * opt.btns - buttons, e.g. [{text: 'close', className: 'strong', onClose: function() {this.close();}}]
	 */
	function Dialog(opt) {
		opt = opt || {};
		opt.width = Math.max(opt.width || _DEFAULT_WIDTH, _MIN_WIDTH);
		this._opt = opt;
		this._id = _im.add(this);
		this._closed = 0;
		this._width = _INIT_WIDTH;
		this._height = _INIT_HEIGHT;
		this._fx = opt.fx;
		this._fxDuration = opt.fxDuration || _FX_DURATION;
		this._beforeClose = opt.beforeClose || $empty;
		this._draggable = null;
		this._dragging = false;
		this._bound = {
			dragstart: YOM.object.bind(this, this._dragstart),
			dragstop: YOM.object.bind(this, this._dragstop)
		};
		this._el = YOM(document.body).append($.Element.create('div', {
			'data-type': 'yom-dialog-wrapper',
			'class': opt.noBorder && opt.src ? '' : 'yom-dialog-wrapper'
		}, $extend({
			position: 'absolute',
			width: this._width + 'px'
		}, opt.noBorder && opt.src ? {
			padding: '0',
			margin: '0',
			border: 'none'
		} : {})));
		this._el.setHtml(YOM.tmpl.render(opt.tmpl || _TMPL, {
			id: this._id,
			title: opt.title,
			content: opt.content,
			contentPadding: opt.contentPadding,
			src: opt.src,
			noBorder: opt.noBorder,
			btns: opt.btns,
			fixed: opt.fixed,
			tips: opt.tips
		}));
		this._bindEvent();
		this._makeDraggable();
		this.setZIndex(opt.zIndex);
		if(this._fx && this._fx != 'fade' || opt.src) {
			opt.height = Math.max(opt.height || _DEFAULT_HEIGHT, _MIN_HEIGHT);
		}
		var self = this;
		if(this._fx == 'fade') {
			this.resize(opt.width, opt.height);
			this._el.fadeIn(this._fxDuration, function() {
				self.focus();
			});
		} else if(this._fx) {
			YOM.Tween.setTimer($empty, this._fxDuration, function(percent) {
				var w = _INIT_WIDTH + (opt.width - _INIT_WIDTH) * percent;
				var h = _INIT_HEIGHT + (opt.height - _INIT_HEIGHT) * percent;
				self.resize(w, h);
				self._el.setStyle('opacity', percent);
				if(percent === 1) {
					self.focus();
				}
			});
		} else {
			this.resize(opt.width, opt.height);
			this.focus();
		}
		this._closeTimeout(opt.closeTimeout, opt.tips);
		YOM.css.load(YOM.LIB_BASE + 'widget/dialog.css');
		Dialog.dispatchEvent(Dialog.createEvent('popup', {dialogId: this._id, opt: this._opt}));
	};
	
	YOM.Class.extend(Dialog, YOM.Event);
	YOM.Class.genericize(Dialog, ['addObservers', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'createEvent'], {bind: Dialog});
	Dialog.addObservers({
		popup: new YOM.Observer(),
		close: new YOM.Observer()
	});
	
	Dialog._im = _im;
	
	Dialog.getInstanceById = function(id) {
		return _im.get(id);	
	};
	
	Dialog.each = function(cb, bind) {
		_im.each(cb, bind);
	};
	
	$extend(Dialog.prototype, {
		_dragstart: function() {
			this._dragging = true;
		},
		
		_dragstop: function() {
			this._dragging = false;
		},
		
		_bindEvent: function() {
			var opt = this._opt;
			var btns = opt.btns;
			if(opt.title) {
				this._el.find('.yom-dialog-title-close-btn').addEventListener('click', this.close, this);
			}
			if(btns) {
				this._el.find('[data-type="yom-dialog-btns"] button').each(function(btn, i) {
					var listener = btns[i] && btns[i].click;
					if(listener) {
						YOM.Event.addListener(btn, 'click', listener, this);
					}
				}, this);
			}
		},
		
		_closeTimeout: function(timeout, tips) {
			if(!(timeout > 0)) {
				return;
			}
			var self = this;
			setTimeout(function() {
				if(!self._closed) {
					var el = self._el.find('[data-type="yom-dialog-tips"]').get();
					if(tips && el && !el.innerHTML) {
						return;
					}
					self.close();
				}
			}, Math.max(_MIN_CLOSE_TIMEOUT, timeout));
			if(tips) {
				var countDown = Math.ceil(timeout / 1000);
				(function() {
					if(!self._closed) {
						var el = self._el.find('[data-type="yom-dialog-tips"]').get();
						if(el && !el.innerHTML) {
							return;
						}
						self.setTips(tips.replace('{{s}}', '<span class="yom-dialog-tips-strong">' + countDown + '</span>').replace(/{{c:?(.*)}}/, function($1, $2) {
								var txt = $2 || 'cancel';
								return '<span class="yom-dialog-tips-op" style="cursor: pointer;" onclick="this.parentNode.innerHTML = \'\';">' + txt + '</span>';
							}));
						if(countDown > 0) {
							countDown--;
							setTimeout(arguments.callee, 1000);
						}
					}
				})();
			}
		},
		
		_makeDraggable: function() {
			if(this.isFixed()) {
				return;
			}
			var handles = this._el.find('[data-type="yom-dialog-title"]');
			if(this._opt.dragHandles) {
				handles = handles.concat(this._el.find(this._opt.dragHandles));
			}
			if(!handles.size()) {
				return;
			}
			YOM.js.require(YOM.LIB_BASE + 'dragdrop.js', function() {
				this._draggable = new YOM.dragdrop.Draggable(this._el, {handles: handles, boundary: 'PAGE'});
				this._draggable.addEventListener('dragstart', this._bound.dragstart);
				this._draggable.addEventListener('dragstop', this._bound.dragstop);
			}, {bind: this});
		},
		
		isFixed: function() {
			return this._opt.fixed;
		},
		
		setTips: function(tips) {
			var el = this._el.find('[data-type="yom-dialog-tips"]');
			if(el.size()) {
				el.setHtml(tips);
			}
		},
		
		focus: function() {
			if(this._opt.focus) {
				var el = this._el.find(this._opt.focus).get();
				if(el) {
					try {
						el.focus();
					} catch(e) {}
				}
			}
		},
		
		getId: function() {
			return this._id;	
		},
		
		getZIndex: function() {
			return this._el.getStyle('z-index');	
		},
		
		setZIndex: function(z) {
			if(!isNaN(z)) {
				this._el.setStyle('z-index', z);
			}
		},
		
		centralize: function(leftFix, topFix) {
			leftFix = leftFix || 0;
			topFix = topFix || 0;
			var wrapper = this._el;
			var viewRect = YOM.Element.getViewRect();
			var wrapperRect = wrapper.getRect();
			wrapper.setStyle({
				left: Math.max(0, leftFix + viewRect.left + (viewRect.width - wrapperRect.width) / 2) + 'px',
				top: Math.max(0, topFix + viewRect.top + (viewRect.height - wrapperRect.height) / 2) + 'px'
			});
		},
		
		resize: function(w, h, opt) {
			if(w < _MIN_WIDTH || !isNaN(h) && h < _MIN_HEIGHT) {
				return;
			}
			opt = opt || {};
			var wrapper = this._el;
			var fixWidth, fixHeight;
			var thisOpt = this._opt;
			if(thisOpt.noBorder && thisOpt.src) {
				wrapper.setStyle({
					width: w + 'px',
					height: h + 'px'
				});
			} else {
				if(YOM.browser.isQuirksMode()) {
					fixWidth = wrapper.getRect().width - wrapper.find('[data-type="yom-dialog-inner"]').getRect().width;
					fixHeight = 0;
				} else {
					fixWidth = 0;
					fixHeight = -2 * (thisOpt.contentPadding || 0);
				}
				wrapper.setStyle({
					width: (w + fixWidth) + 'px'
				});
				if(thisOpt.src) {
					this._el.find('[data-type="yom-dialog-frame"]').setStyle({
						height: h + 'px'
					});
				} else {
					this._el.find('[data-type="yom-dialog-content"]').setStyle({
						height: !isNaN(h) ? (h + fixHeight) + 'px' : 'auto'
					});
				}
				
			}
			this._dragging || opt.noCentralize || this.centralize(opt.leftFix || 0, opt.topFix || 0);
			this._width = w;
			this._height = h;
		},
		
		close: function() {
			try {
				if(this._beforeClose.call(this) === 'false') {
					return;
				}
			} catch(e) {
				if(YOM.debugMode) {
					throw new YOM.Error(YOM.Error.getCode(_ID, 1));
				}
			}
			var self = this;
			if(this._fx == 'fade') {
				this._el.fadeOut(this._fxDuration, function() {
					self._el.remove();
					self._el = null;
				});
			} else if(this._fx) {
				var wrapper = this._el;
				var width = this._width;
				var height = this._height;
				var viewRect = YOM.Element.getViewRect();
				var wrapperRect = wrapper.getRect();
				var leftFix = wrapperRect.left - (viewRect.left + (viewRect.width - wrapperRect.width) / 2)
				var topFix = wrapperRect.top - (viewRect.top + (viewRect.height - wrapperRect.height) / 2)
				YOM.Tween.setTimer($empty, this._fxDuration, function(percent) {
					var w = width - (width - _INIT_WIDTH) * percent;
					var h = height - (height - _INIT_HEIGHT) * percent;
					self.resize(w, h, {leftFix: leftFix, topFix: topFix});
					self._el.setStyle('opacity', 1 - percent);
					if(percent === 1) {
						self._el.remove();
						self._el = null;
					}
				});
			} else {
				this._el.remove();
				this._el = null;
			}
			if(this._draggable) {
				this._draggable.removeEventListener('dragstart', this._bound.dragstart);
				this._draggable.removeEventListener('dragstop', this._bound.dragstop);
				this._draggable.destory();
				this._draggable = null;
			}
			this._closed = 1;
			_im.remove(this._id);
			Dialog.dispatchEvent(Dialog.createEvent('close', {dialogId: this._id, opt: this._opt}));
		}
	});
	
	return Dialog;
});

