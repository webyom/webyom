/**
 * 触摸事件虚类
 * @class YOM.Event.VirtualTouchEventHandler
 */
YOM.Event.addModule('VirtualTouchEventHandler', function(YOM) {
	VirtualTouchEventHandler = function(el) {
		this._delegateEl = el;
		this._srcElement = null;
		this._startPointX = this._startPointY = 0;
		this._endPointX = this._endPointY = 0;
		this._startTime = 0;
		this._init();
	};
	
	VirtualTouchEventHandler.prototype = {
		_init: function() {
			YOM.Event.addListener(this._delegateEl, 'touchstart', this);
			YOM.Event.addListener(this._delegateEl, 'touchmove', this);
			YOM.Event.addListener(this._delegateEl, 'touchend', this);
		},
		
		/**
		 * 事件分发方法，由子类复写实现具体逻辑
		 */
		_dispatch: function() {
			/* sample
			var me = document.createEvent('Events');
			me.initEvent('touch', true, false);
			this._srcElement.dispatchEvent(me);
			*/
		},
		
		_touchstart: function(e) {
			this._srcElement = e.srcElement;
			if(this._srcElement.nodeType == 3) {
				this._srcElement = this._srcElement.parentNode;
			}
			this._startPointX = this._endPointX = e.targetTouches[0].pageX;
			this._startPointY = this._endPointY = e.targetTouches[0].pageY;
			this._startTime = new Date();
		},
		
		_touchmove: function(e) {
			this._endPointX = e.targetTouches[0].pageX;
			this._endPointY = e.targetTouches[0].pageY;
		},
		
		/**
		 * 触摸结束时判断是否需要触发事件的方法，由子类复写实现具体逻辑
		 */
		_touchend: function(e) {
			/* sample
			var endTime = new Date();
			if(
				endTime - this._startTime > 400 ||
				Math.abs(this._endPointX - this._startPointX) > 15 ||
				Math.abs(this._endPointY - this._startPointY) > 15
			) {
				return;
			}
			this._dispatch();
			*/
		},
		
		handleEvent: function(e) {
			this['_' + e.type](e);
		},
		
		destroy: function() {
			YOM.Event.removeListener(this._delegateEl, 'touchstart', this);
			YOM.Event.removeListener(this._delegateEl, 'touchmove', this);
			YOM.Event.removeListener(this._delegateEl, 'touchend', this);
		},
		
		constructor: VirtualTouchEventHandler
	};
	
	return VirtualTouchEventHandler;
});
/**
 * @class YOM.Event.TouchEventHandler
 */
YOM.Event.addModule('TouchEventHandler', function(YOM) {
	TouchEventHandler = function(el) {
		TouchEventHandler.superClass.constructor.apply(this, YOM.array.getArray(arguments));
	};
	
	YOM.Class.extend(TouchEventHandler, YOM.Event.VirtualTouchEventHandler);
	
	TouchEventHandler.prototype._distanceLimit = 15;
	TouchEventHandler.prototype._timeLimit = 400;
	
	TouchEventHandler.prototype._dispatch = function() {
		var me = document.createEvent('Events');
		me.initEvent('touch', true, false);
		this._srcElement.dispatchEvent(me);
	};
	
	TouchEventHandler.prototype._touchend = function(e) {
		if(
			new Date() - this._startTime > this._timeLimit ||
			Math.abs(this._endPointX - this._startPointX) > this._distanceLimit ||
			Math.abs(this._endPointY - this._startPointY) > this._distanceLimit
		) {
			return;
		}
		this._dispatch();
	};
	
	YOM.Event.addCustomizedEvent('touch', TouchEventHandler);
	
	return TouchEventHandler;
});
/**
 * @class YOM.Event.SlideEventHandler
 */
YOM.Event.addModule('SlideEventHandler', function(YOM) {
	var SlideEventHandler = function(el) {
		SlideEventHandler.superClass.constructor.apply(this, YOM.array.getArray(arguments));
	};
	
	YOM.Class.extend(SlideEventHandler, YOM.Event.VirtualTouchEventHandler);
	
	SlideEventHandler.prototype._distanceLimitX = 160;
	SlideEventHandler.prototype._distanceLimitY = 40;
	SlideEventHandler.prototype._timeLimit = 400;
	
	SlideEventHandler.prototype._dispatch = function() {
		var me = document.createEvent('Events');
		me.initEvent('slide', true, false);
		me.direction = this._endPointX > this._startPointX ? 1 : 0;
		this._srcElement.dispatchEvent(me);
	};
	
	SlideEventHandler.prototype._touchmove = function(e) {
		this._endPointX = e.targetTouches[0].pageX;
		this._endPointY = e.targetTouches[0].pageY;
		if(
			new Date() - this._startTime < this._timeLimit &&
			Math.abs(this._endPointX - this._startPointX) > 20 &&
			Math.abs(this._endPointY - this._startPointY) < this._distanceLimitY
		) {
			e.preventDefault();
		}
	};
	
	SlideEventHandler.prototype._touchend = function(e) {
		if(
			new Date() - this._startTime > this._timeLimit ||
			Math.abs(this._endPointX - this._startPointX) < this._distanceLimitX ||
			Math.abs(this._endPointY - this._startPointY) > this._distanceLimitY
		) {
			return;
		}
		this._dispatch();
	};
	
	YOM.Event.addCustomizedEvent('slide', SlideEventHandler);
	
	return SlideEventHandler;
});
