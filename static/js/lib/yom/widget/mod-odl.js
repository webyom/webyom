/**
 * @fileoverview ModOdl Widget
 */
define(function(require) {
	var YOM = require('yom/core-pkg');
	
	var _frameRect = YOM.Element.getFrameRect();
	
	function Loader(opt) {
		opt = opt || {};
		this._preLoadHeight = opt.preLoadHeight || 0;
		this._interval = opt.interval || 1000;
		this._clientBottomGetter = opt.clientBottomGetter || this._getClientBottom;
		this._count = 0;
		this._list = {};
		this._intervalRef = null;
	};
	
	Loader.prototype = {
		_getClientBottom: function() {
			return YOM.Element.getViewRect(top.document).bottom - _frameRect.top;
		},
		
		_loadOnDemand: function() {
			var cbs, offset, clientBottom = this._clientBottomGetter();
			for(offset in this._list) {
				if(clientBottom > offset) {
					cbs = this._list[offset];
					while(cbs.length) {
						cbs.shift().call();
						this._count--;
					}
					delete this._list[offset];
				}
			}
			if(!this._count) {
				clearInterval(this._intervalRef);
				this._intervalRef = null;
			}
		},
		
		_add: function(el, callback, offset) {
			offset = offset || $(el).getRect().top;
			offset = offset > this._preLoadHeight ? offset - this._preLoadHeight : 0;
			this._list[offset] = this._list[offset] || [];
			this._list[offset].push(function() {
				callback(el);
			});
			this._count++;
			if(!this._intervalRef) {
				this._intervalRef = setInterval($bind(this, this._loadOnDemand), this._interval);
			}
		},
		
		add: function(els, callback, offset) {
			var self = this;
			$(els).each(function(el) {
				self._add(el, callback, offset);
			});
		}
	};
	
	return Loader;
});
