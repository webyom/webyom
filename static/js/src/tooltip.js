/**
 * @namespace
 */
$$.tooltip = (function() {
	var _guideTooltip;
	var _guidePool = [];
	
	function _getElTips(el, attr) {
		el = $(el);
		var tips = el.getDatasetVal('tooltip');
		if(!tips && attr) {
			tips = el.getAttr(attr);
			if(tips) {
				el.setDatasetVal('tooltip', tips);
				el.setAttr(attr, '');
			}
		}
		return tips;
	};
	
	function _showGuide(opt) {
		_guideTooltip = _guideTooltip || new YOM.widget.Tooltip({
			keepAlive: true,
			content: '',
			zIndex: 999,
			fx: 'slide',
			beforeClose: function() {
				setTimeout(function() {
					_guidePool.length && _showGuide(_guidePool.shift());
				}, 500);
			}
		});
		_guideTooltip.setContent(opt.content).popup({
			pos: opt.pos,
			direction: opt.direction,
			closeTimeout: opt.closeTimeout,
			target: opt.target,
			offset: opt.offset
		});
	}
	
	function guide(opt) {
		opt = opt || {};
		$.js.require($$_LIB_NAME_URL_HASH['YOM_WIDGET_TOOLTIP'], function(ret) {
			if(!_guideTooltip || _guideTooltip.isClosed() || opt.prior) {
				_showGuide(opt);
			} else {
				_guidePool.push(opt);
			}
		});
		return this;
	};
	
	function _bindAttr(opt) {
		var toolTip = null;
		var toRef = null;
		var attr = opt.attr;
		var maxBubble = opt.maxBubble || 0;
		$(document).addEventListener('mousemove', function(evt) {
			clearTimeout(toRef);
			var pos = {x: $.Event.getPageX(evt), y: $.Event.getPageY(evt)};
			var target = $.Event.getTarget(evt);
			var txt = _getElTips(target, attr);
			var times = 0;
			while(!txt && times < opt.maxBubble) {
				target = target.parentNode;
				txt = _getElTips(target, attr);
				times++;
			}
			if(!txt) {
				toolTip && toolTip.close();
				return;
			}
			toRef = setTimeout(function() {
				$.js.require($$_LIB_NAME_URL_HASH['YOM_WIDGET_TOOLTIP'], function(ret) {
					toolTip = toolTip || new YOM.widget.Tooltip({
						content: '',
						zIndex: 999,
						fx: 'fade',
						noCloseBtn: true,
						keepAlive: true
					});
					toolTip.setContent(txt).popup({
						pos: pos,
						offset: {L: {x: -10, y: -15}, B: {x: -15, y: 30}, T: {x: -15, y: -15}}
					});
				});
			}, 200);
		});
		_bindAttr = $empty();
	};
	
	function bindAttr(opt) {
		opt = opt || {};
		_bindAttr(opt);
	};
	
	return {
		bindAttr: bindAttr,
		guide: guide
	};
})();
