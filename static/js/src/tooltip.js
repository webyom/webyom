/**
 * @namespace
 */
$$.tooltip = (function() {
	var _guideTooltip;
	var _guidePool = [];
	
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
	
	function _bindAttr(attr) {
		var _toolTip = null;
		var _toRef = null;
		$(document).addEventListener('mousemove', function(evt) {
			clearTimeout(_toRef);
			var pos = {x: $.Event.getPageX(evt), y: $.Event.getPageY(evt)};
			var target = $($.Event.getTarget(evt));
			var txt = target.getDatasetVal('tooltip');
			if(!txt) {
				if(attr) {
					txt = target.getAttr(attr);
					if(txt) {
						target.setDatasetVal('tooltip', txt);
						target.setAttr(attr, '');
					} else {
						_toolTip && _toolTip.close();
						return;
					}
				} else {
					_toolTip && _toolTip.close();
					return;
				}
			}
			_toRef = setTimeout(function() {
				$.js.require($$_LIB_NAME_URL_HASH['YOM_WIDGET_TOOLTIP'], function(ret) {
					_toolTip = _toolTip || new YOM.widget.Tooltip({
						content: '',
						zIndex: 999,
						fx: 'fade',
						noCloseBtn: true,
						keepAlive: true
					});
					_toolTip.setContent(txt).popup({
						pos: pos,
						offset: {L: {x: -10, y: -15}, B: {x: -15, y: 30}, T: {x: -15, y: -15}}
					});
				});
			}, 200);
		});
		_bindAttr = $empty();
	};
	
	function bindAttr(attr) {
		_bindAttr(attr);
	};
	
	return {
		bindAttr: bindAttr,
		guide: guide
	};
})();
