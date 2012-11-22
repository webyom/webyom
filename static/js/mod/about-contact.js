define('./about-contact.tpl.html', [], function() {
	function $encodeHtml(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, '&#96;').replace(/'/g, '&#39;').replace(/"/g, '&quot;')
	}
	return function($data, $opt) {
		$data = $data || {}
		var _$out_= []
		var $print = function(str) {_$out_.push(str)}
		with($data) {
		_$out_.push('<div class="block"><div class="blockInner"><ul class="tabs c"><li class="a"><a href="/view/about/profile">Profile</a></li><li class="b"><a href="/view/about/work">Work</a></li><li class="c"><a href="/view/about/contact">Contact</a></li></ul><p>Email: webyom@gmail.com<br />QQ: 251830327</p></div></div>')
		}
		return _$out_.join('')
	}
})

define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg', './about-contact.tpl.html'], function(require, $, ajaxHistory, $$) {
	var modKey = 'contact', 
		modName = 'CONTACT', 
		modId = 30302
	
	var _tmpl = require('./about-contact.tpl.html')
	
	var _cssList = []
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments))
	}
	
	$.Class.extend(Handler, $$.Handler)
	
	Handler.prototype._unload = function(parentUnloaded) {
		$.css.unload(_cssList)
		return Handler.superClass._unload.apply(this, $.array.getArray(arguments))
	}
	
	Handler.prototype.handle = function(mark, fullMark, reqInfo) {
		if(!this.isCurrentHandler()) {
			return
		}
		$.css.load(_cssList)
		ajaxHistory.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '))
		$$.ui.setMainContent(_tmpl({}))
	}
	
	return new Handler({}, modKey, $$.Handler.mod.root.mod.about)
})

