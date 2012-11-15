/**
 * @fileoverview ImgOdl Widget
 */
define([], function(require) {
	var YOM = require('../../core/core-built');
	
	var _ID = 128005;
	var _SRC_ATTR_NAME = 'data-init-src';
	var _MARK_ATTR_NAME = 'data-odl-marked';
	
	var _frameRect = YOM.Element.getFrameRect();
	
	function _getImgOffsetTop(img) {
		return new YOM.Element(img).getRect().top;
	};
	
	function Loader(opt) {
		opt = opt || {};
		this._mode = 0;//1-good performance and bad quality; other-bad performance and good quality
		this._preLoadHeight = opt.preLoadHeight || 0;
		this._interval = opt.interval || 1000;
		this._clientBottomGetter = opt.clientBottomGetter || this._getClientBottom;
		this._srcGetter = opt.srcGetter || this._getSrc;
		this._count = 0;
		this._count2 = 0;
		this._list = {};
		this._list2 = [];
		this._intervalRef = null;
		this._toRef = null;
	};
	
	Loader.prototype = {
		_getClientBottom: function() {
			return YOM.Element.getViewRect(top.document).bottom - _frameRect.top;
		},
	
		_getSrc: function(src, img) {
			return src;
		},
		
		_loadOnDemand: function() {
			var i, src, imgs, img, imgOffsetTop, clientBottom = this._clientBottomGetter();
			for(imgOffsetTop in this._list) {//good performance and bad quality
				if(clientBottom > imgOffsetTop) {
					imgs = this._list[imgOffsetTop];
					for(i = 0, l = imgs.length; i < l; i ++) {
						img = imgs[i];
						src = this._srcGetter(img.getAttribute(_SRC_ATTR_NAME) || img.src, img);
						if(src) {
							img.src = src;
						}
						img.removeAttribute(_SRC_ATTR_NAME);
						img.removeAttribute(_MARK_ATTR_NAME);
						this._count--;
					}
					delete this._list[imgOffsetTop];
				}
			}
			for(i = this._list2.length - 1; i >= 0; i--) {//bad performance and good quality
				img = this._list2[i];
				if(!(img.parentNode && img.parentNode.tagName)) {//removed from dom tree
					this._list2.splice(i, 1);
					this._count2--;
					continue;
				}
				imgOffsetTop = _getImgOffsetTop(img);
				imgOffsetTop = imgOffsetTop > this._preLoadHeight ? imgOffsetTop - this._preLoadHeight : 0;
				if(clientBottom > imgOffsetTop) {
					img.src = this._srcGetter(img.getAttribute(_SRC_ATTR_NAME) || img.src, img);
					img.removeAttribute(_SRC_ATTR_NAME);
					img.removeAttribute(_MARK_ATTR_NAME);
					this._list2.splice(i, 1);
					this._count2--;
				}
			}
			if(!this._count && !this._count2) {
				clearInterval(this._intervalRef);
				this._intervalRef = null;
			}
		},
		
		/**
		 * good performance and bad quality
		 * @private
		 */
		_check: function() {
			var imgs, img, index;
			imgs = document.images;
			for(var i = 0, l = imgs.length; i < l; i++) {
				img = imgs[i];
				if(img.getAttribute(_SRC_ATTR_NAME) && img.getAttribute(_MARK_ATTR_NAME) != '1') {
					index = _getImgOffsetTop(img);
					index = index > this._preLoadHeight ? index - this._preLoadHeight : 0;
					this._list[index] ? this._list[index].push(img) : this._list[index] = [img];
					img.setAttribute(_MARK_ATTR_NAME, '1');
					this._count++;
				}
			}
			if(!this._count || this._intervalRef) {
				return;
			}
			this._loadOnDemand();
			this._intervalRef = setInterval(YOM.object.bind(this, this._loadOnDemand), this._interval);
		},
		
		/**
		 * bad performance and good quality
		 * @private
		 */
		_check2: function() {
			var imgs, img;
			imgs = document.images;
			for(var i = 0, l = imgs.length; i < l; i++) {
				img = imgs[i];
				if(img.getAttribute(_SRC_ATTR_NAME) && img.getAttribute(_MARK_ATTR_NAME) != '1') {
					img.setAttribute(_MARK_ATTR_NAME, '1');
					this._list2.unshift(img);
					this._count2++;
				}
			}
			if(!this._count2 || this._intervalRef) {
				return;
			}
			this._loadOnDemand();
			this._intervalRef = setInterval(YOM.object.bind(this, this._loadOnDemand), this._interval);
		},
		
		/**
		 * @param {Object} opt
		 * {
		 * 	delay: {Number}
		 * }
		 */
		check: function(opt) {
			var self = this;
			opt = opt || {};
			clearTimeout(this._toRef);
			this._toRef = setTimeout(function() {
				self._mode === 1 ? self._check() : self._check2();
			}, opt.delay || 0);
		}
	};
	
	return Loader;
});
