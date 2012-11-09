define(['require', 'yom/core-pkg', 'yom/history', 'main-pkg'], function(require, $, ajaxHistory, $$) {
	var modKey = 'about', 
		modName = 'ABOUT', 
		modId = 303;
	
	var _TMPL = [
	].join('');
	
	var _cssList = [];
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	
	$.Class.extend(Handler, $$.Handler);
	
	Handler.prototype._unload = function(parentUnloaded) {
		$.css.unload(_cssList);
		return Handler.superClass._unload.apply(this, $.array.getArray(arguments));
	};
	
	Handler.prototype.handle = function() {
		var res = Handler.superClass.handle.apply(this, $.array.getArray(arguments));
		if(res !== 0) {
			return res;
		}
		$$.ui.turnOnMenu('c');
		return 0;
	};
	
	return new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, modKey, $$.Handler.mod.root, {
		modKeyInfoHash: {//p: priority of preload，this bigger p the higher priority。key，id and name must be unique
			'profile': {p: 1, key: 'profile', title: 'Profile', id: 30300, name: 'PROFILE', url: 'mod/about-profile'},
			'work': {p: 2, key: 'work', title: 'Work', id: 30301, name: 'WORK', url: 'mod/about-work'},
			'contact': {p: 3, key: 'contact', title: 'Contact', id: 30302, name: 'CONTACT', url: 'mod/about-contact'}
		},
		defaultModkey: 'profile'
	});
});
