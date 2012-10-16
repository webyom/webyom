/**
 * @namespace YOM.widget.Mask
 */
define(function(require) {
	var YOM = require('yom/core-pkg');
	
	var _ID = 128001;
	
	var _defaultStyle = {
		opacity: '0.3',
		position: 'absolute',
		background: '#000',
		display: 'none'
	};
	
	function Mask(opt) {
		opt = opt || {};
		var style = $extend(_defaultStyle, opt.style);
		this._opacity = style.opacity || '1';
		this._target = YOM(opt.target || document.body);
		this._el = YOM(document.body).append(YOM.Element.create('div', {}, style));
	};
	
	Mask.setDefaultStyle = function(style) {
		_defaultStyle = style;
	};
	
	$extend(Mask.prototype, {
		addEventListener: function(type, listener, bind) {
			return this._el.addEventListener(type, listener, bind);
		},
		
		removeEventListener: function(type, listener) {
			return this._el.removeEventListener(type, listener);
		},
		
		setStyle: function(name, val) {
			this._el.setStyle(name, val);
			this._opacity = this._el.getStyle('opacity');
		},
		
		setContent: function(content) {
			this._el.setHtml(content);
		},
		
		resize: function() {
			var rect = this._target.getRect();
			if(YOM.Element.isBody(this._target)) {
				var viewRect = YOM.Element.getViewRect();
				rect.height = Math.max(rect.height, viewRect.height);
				rect.width = Math.max(rect.width, viewRect.width);
			}
			this._el.setStyle({
				left: rect.left + 'px',
				top: rect.top + 'px',
				height: rect.height + 'px',
				width: rect.width + 'px'
			});
		},
		
		show: function(fade) {
			var self = this;
			this.resize();
			this._el.show();
			if(fade) {
				this._el.tween(fade, {
					origin: {
						style: {
							opacity: 0
						}
					},
					target: {
						style: {
							opacity: this._opacity
						}
					}
				});
			} else {
				this.setStyle('opacity', this._opacity);
			}
		},
		
		hide: function(fade) {
			var self = this;
			if(fade) {
				this._el.tween(fade, {
					origin: {
						style: {
							opacity: this._opacity
						}
					},
					target: {
						style: {
							opacity: 0
						}
					},
					complete: function() {
						self._el.hide();
					}
				});
			} else {
				this._el.hide();
			}
		},
		
		destory: function() {
			this._el.remove();
			this._el = null;
			this._target = null;
		}
	});
	
	return Mask;
});
