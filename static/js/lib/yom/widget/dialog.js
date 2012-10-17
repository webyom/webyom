/**
 * @namespace YOM.widget.Dialog
 */
define(function(require) {
	var YOM = require('yom/core-pkg');
	
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
			'<iframe data-type="yom-dialog-frame" style="width: 100%; height: 100%;" frameborder="0" scrolling="no" allowtransparency="yes" src="<%=frameSrc%>"></iframe>',
		'<%} else {%>',
			'<div data-type="yom-dialog-inner" class="yom-dialog-inner" style="width: 100%; height: 100%; padding: 0; margin: 0; border: none; overflow: hidden;">',
				'<%if(title) {%>',
					'<div data-type="yom-dialog-title" class="yom-dialog-title" style="overflow: hidden; <%=fixed ? "cursor: default;" : ""%>">',
						'<h3><%=title%></h3>',
						'<button data-type="yom-dialog-title-close-btn" class="yom-dialog-title-close-btn" title="Close">x</button>',
					'</div>',
				'<%}%>',
				'<%if(src) {%>',
					'<iframe data-type="yom-dialog-frame" style="width: 100%; display: block;" frameborder="0" scrolling="no" allowtransparency="yes" src="<%=frameSrc%>"></iframe>',
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
	 * opt.keepAlive - do not remove the dialog from dom tree after close
	 * opt.width - width of dialog content
	 * opt.height - height of dialog content
	 * opt.zIndex - zIndex of dialog
	 * opt.title - title of the dialog
	 * opt.content - content of the dialog
	 * opt.tmpl - customized tmpl
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
	 * opt.focus - the css query string of focus element
	 * opt.btns - buttons, e.g. [{text: 'close', className: 'strong', onClose: function() {this.close();}}]
	 */
	function Dialog(opt) {
		opt = opt || {};
		opt.width = Math.max(opt.width || _DEFAULT_WIDTH, _MIN_WIDTH);
		this._opt = opt;
		this._id = _im.add(this);
		this._closed = 1;
		this._closeToRef = null;
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
		this._el = YOM(document.body).append(YOM.Element.create('div', {
			'data-type': 'yom-dialog-wrapper',
			'class': opt.noBorder && opt.src ? '' : 'yom-dialog-wrapper'
		}, $extend({
			display: 'none',
			position: 'absolute'
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
			frameSrc: opt.src && YOM.util.appendQueryString(opt.src, "dialogId=" + this._id, true),
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
		YOM.css.load(require.toUrl('./dialog.css'));
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
				this._el.find('[data-type="yom-dialog-title-close-btn"]').addEventListener('click', this.close, this);
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
			this._closeToRef = setTimeout(function() {
				var el = self._el.find('[data-type="yom-dialog-tips"]').get();
				if(tips && el && !el.innerHTML) {
					return;
				}
				self.close();
			}, Math.max(_MIN_CLOSE_TIMEOUT, timeout));
			if(tips) {
				var countDown = Math.ceil(timeout / 1000);
				(function() {
					if(!self.isClosed()) {
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
			var self = this;
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
			require(['yom/dragdrop-pkg'], function(dragdrop) {
				self._draggable = new dragdrop.Draggable(self._el, {handles: handles, boundary: 'PAGE'});
				self._draggable.addEventListener('dragstart', self._bound.dragstart);
				self._draggable.addEventListener('dragstop', self._bound.dragstop);
			});
		},
		
		_show: function() {
			this._el.show();	
		},
		
		_hide: function() {
			if(this._opt.keepAlive) {
				this._el.hide();	
			} else {
				this._el.remove();
				this._el = null;
			}
		},
		
		isFixed: function() {
			return this._opt.fixed;
		},
		
		setTips: function(tips) {
			if(!this._el) {
				return this;
			}
			var el = this._el.find('[data-type="yom-dialog-tips"]');
			if(el.size()) {
				el.setHtml(tips);
			}
			return this;
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
		
		centralize: function(leftFix, topFix) {
			if(!this._el) {
				return this;
			}
			leftFix = leftFix || 0;
			topFix = topFix || 0;
			var wrapper = this._el;
			var viewRect = YOM.Element.getViewRect();
			var wrapperRect = wrapper.getRect();
			wrapper.setStyle({
				left: Math.max(0, leftFix + viewRect.left + (viewRect.width - wrapperRect.width) / 2) + 'px',
				top: Math.max(0, topFix + viewRect.top + (viewRect.height - wrapperRect.height) / 2) + 'px'
			});
			return this;
		},
		
		resize: function(w, h, opt) {
			if(!this._el) {
				return this;
			}
			if(w < _MIN_WIDTH || !isNaN(h) && h < _MIN_HEIGHT) {
				return this;
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
			return this;
		},
		
		getContentHolder: function() {
			return this._el && this._el.find('[data-type="yom-dialog-content"]').get();
		},
		
		getFrameElement: function() {
			return this._el && this._el.find('iframe').get();
		},
		
		setContent: function(content) {
			var holder = this.getContentHolder();
			if(holder) {
				holder.innerHTML = content;
			}
		},
		
		popup: function() {
			var self = this;
			var opt = this._opt;
			var fx = this._fx;
			var elTop, elRect, viewRect, docSize, oStyle;
			if(!this._el) {
				return this;
			}
			clearTimeout(this._closeToRef);
			this._closed = 0;
			this._show();
			if(fx == 'fade') {
				this.resize(opt.width, opt.height);
				this._el.fadeIn(this._fxDuration, function() {
					self.focus();
				});
			} else if(fx == 'slideDown' || fx == 'slideUp') {
				this.resize(opt.width, opt.height);
				elTop = this._el.getStyle('top');
				elRect = this._el.getRect();
				viewRect = YOM.Element.getViewRect();
				docSize = YOM.Element.getDocSize();
				oStyle = {top: Math.min(docSize.height - elRect.height, parseInt(elTop) + (fx == 'slideUp' ? viewRect.height : -viewRect.height) / 2) + 'px', opacity: '0'};
				this._el.setStyle(oStyle);
				this._el.tween(this._fxDuration, {
					origin: {
						style: oStyle
					},
					target: {
						style: {top: elTop, opacity: '1'}
					},
					complete: function() {
						self.focus();
					}
				});
			} else if(fx) {
				self.resize(_INIT_WIDTH, _INIT_HEIGHT);
				self._el.setStyle('opacity', '0');
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
			Dialog.dispatchEvent(Dialog.createEvent('popup', {dialogId: this._id, opt: this._opt}));
			return this;
		},
		
		close: function() {
			var fx = this._fx;
			var elTop, elRect, viewRect, docSize;
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
			if(fx == 'fade') {
				this._el.fadeOut(this._fxDuration, function() {
					self._hide();
				});
			} else if(fx == 'slideDown' || fx == 'slideUp') {
				elTop = this._el.getStyle('top');
				elRect = this._el.getRect();
				viewRect = YOM.Element.getViewRect();
				docSize = YOM.Element.getDocSize();
				this._el.tween(this._fxDuration, {
					origin: {
						style: {top: elTop, opacity: '1'}
					},
					target: {
						style: {top: Math.min(docSize.height - elRect.height, parseInt(elTop) + (fx == 'slideUp' ? -viewRect.height : viewRect.height) / 2) + 'px', opacity: '0'}
					},
					complete: function() {
						self._hide();
					}
				});
			} else if(fx) {
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
						self._hide();
					}
				});
			} else {
				this._hide();
			}
			if(!this._opt.keepAlive) {
				if(this._draggable) {
					this._draggable.removeEventListener('dragstart', this._bound.dragstart);
					this._draggable.removeEventListener('dragstop', this._bound.dragstop);
					this._draggable.destory();
					this._draggable = null;
				}
				_im.remove(this._id);
			}
			this._closed = 1;
			Dialog.dispatchEvent(Dialog.createEvent('close', {dialogId: this._id, opt: this._opt}));
			return this;
		},
		
		isClosed: function() {
			return !!this._closed;
		}
	});
	
	return Dialog;
});
