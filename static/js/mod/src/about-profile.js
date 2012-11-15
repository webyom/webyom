define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg'], function(require, $, ajaxHistory, $$) {
	var modKey = 'profile', 
		modName = 'PROFILE', 
		modId = 30300;
	
	var _tmpl = require('./about-profile.tpl.html');
	
	var _cssList = [];
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	
	$.Class.extend(Handler, $$.Handler);
	
	Handler.prototype._unload = function(parentUnloaded) {
		$.css.unload(_cssList);
		return Handler.superClass._unload.apply(this, $.array.getArray(arguments));
	};
	
	Handler.prototype.handle = function(mark, fullMark, reqInfo) {
		if(!this.isCurrentHandler()) {
			return;
		}
		$.css.load(_cssList);
		ajaxHistory.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
		$$.ui.setMainContent(_tmpl({}));
	};
	
	return new Handler({}, modKey, $$.Handler.mod.root.mod.about);
});
