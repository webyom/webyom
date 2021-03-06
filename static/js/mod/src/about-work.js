define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg', './about-work.tpl.html'], function(require, $, ajaxHistory, $$, tmpl) {
	var modKey = 'work', 
		modName = 'WORK', 
		modId = 30301
	
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
		$$.ui.setMainContent(tmpl({key: 'mod.about.work'}))
	}
	
	return new Handler({}, modKey, $$.Handler.mod.root.mod.about)
})

