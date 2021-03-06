/**
 * @namespace $$.tooltip
 */
define(['require', 'yom/core/core-built'], function(require, $) {
	var _guideTooltip
	var _guidePool = []
	
	function _getElTips(el, attr) {
		if(!el) {
			return ''
		}
		el = $(el)
		var tips = el.getDatasetVal('tooltip')
		if(!tips && attr) {
			tips = el.getAttr(attr)
			if(tips) {
				el.setDatasetVal('tooltip', tips)
				el.setAttr(attr, '')
			}
		}
		return tips
	}
	
	function _showGuide(opt) {
		_guideTooltip = _guideTooltip || new YOM.widget.Tooltip({
			keepAlive: true,
			content: '',
			zIndex: opt.zIndex || 99,
			beforeClose: function() {
				setTimeout(function() {
					_guidePool.length && _showGuide(_guidePool.shift())
				}, 500)
			}
		})
		_guideTooltip.setContent(opt.content).popup({
			fx: opt.fx || 'slide',
			pos: opt.pos,
			direction: opt.direction,
			closeTimeout: opt.closeTimeout,
			target: opt.target,
			offset: opt.offset
		})
	}
	
	function guide(opt) {
		opt = opt || {}
		$.js.require($$_LIB_NAME_URL_HASH['YOM_WIDGET_TOOLTIP'], function(ret) {
			if(!_guideTooltip || _guideTooltip.isClosed() || opt.prior) {
				_showGuide(opt)
			} else {
				_guidePool.push(opt)
			}
		})
		return this
	}
	
	function _bindAttr(opt) {
		var toolTip = null
		var toRef = null
		var attr = opt.attr
		var maxBubble = opt.maxBubble || 0
		$(document).addEventListener('mousemove', function(evt) {
			clearTimeout(toRef)
			var pos = {x: $.Event.getPageX(evt), y: $.Event.getPageY(evt)}
			var target = $.Event.getTarget(evt)
			var txt = _getElTips(target, attr)
			var times = 0
			while(!txt && times < opt.maxBubble) {
				target = target.parentNode
				txt = _getElTips(target, attr)
				times++
			}
			if(!txt) {
				toolTip && toolTip.close()
				return
			}
			toRef = setTimeout(function() {
				require(['yom/widget/tooltip/tooltip-built'], function(Tooltip) {
					var opt = {}
					txt = txt.replace((/^\[([^\]]+?)\]/), function(m, c) {
						c = c.split(',')
						$.array.each(c, function(item) {
							var key, val
							item = item.split(':')
							key = $.string.trim(item[0])
							val = $.string.trim(item[1])
							if(!key) {
								return
							}
							opt[key] = val
						})
						return ''
					})
					toolTip = toolTip || new Tooltip({
						content: '',
						zIndex: 999,
						noCloseBtn: true,
						keepAlive: true
					})
					toolTip.setContent(txt).popup({
						direction: opt.direction,
						fx: opt.fx || 'fade',
						pos: pos,
						offset: {L: {x: -10, y: -15}, B: {x: -15, y: 30}, T: {x: -15, y: -15}}
					})
				})
			}, 200)
		})
		_bindAttr = $empty()
	}
	
	function bindAttr(opt) {
		opt = opt || {}
		_bindAttr(opt)
	}
	
	return {
		bindAttr: bindAttr,
		guide: guide
	}
})
