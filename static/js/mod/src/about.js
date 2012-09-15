(function(modKey, modName, modId) {
	var _TMPL = [
		'<div class="block"><div class="blockInner">',
			'<ul class="tabs">',
				'<li class="a"><a href="/view/about/profile">Profile</a></li>',
				'<li class="b"><a href="/view/about/work">Work</a></li>',
			'</ul>',
			'<div id="aboutContent">',
			'</div>',
		'</div></div>'
	].join('');
	
	var _cssList = [];
	
	var Handler = function(observers, modName, parent, opt) {
		Handler.superClass.constructor.apply(this, $.array.getArray(arguments));
	};
	
	$.Class.extend(Handler, $$.Handler);
	
	Handler.prototype._unload = function() {
		$.css.unload(_cssList);
		$.js.unload(this.getModInfo().url);
		return Handler.superClass._unload.call(this);
	};
	
	Handler.prototype.handle = function() {
		var res = Handler.superClass.handle.apply(this, $.array.getArray(arguments));
		if(res !== 0) {
			return res;
		}
		$('#mainPart').size() || $$.ui.resetContent();
		$('#mainPart').setHtml($.tmpl.render(_TMPL, {}, {key: 'mod.about'}));
		$$.ui.turnOnMenu('c');
		return 0;
	};
	
	new Handler({
		beforeunloadmod: new $.Observer(),
		loadmod: new $.Observer()
	}, modKey, $$.mod.root, {
		modKeyInfoHash: {//p: priority of preload，this bigger p the higher priority。key，id and name must be unique
			'profile': {p: 1, key: 'profile', title: 'Profile', id: 30300, name: 'PROFILE', handler: {
				handle: function() {
					var handler = $$.mod.root.mod.about.mod.profile
					handler.handle.apply(handler, $.array.getArray(arguments));
				}
			}},
			'work': {p: 2, key: 'work', title: 'Work', id: 30301, name: 'WORK', url: '/static/js/mod/about-work.js'}
		},
		defaultModkey: 'profile'
	});
})('about', 'ABOUT', 303);