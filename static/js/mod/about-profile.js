define('mod/about-profile', ['require', 'yom/core-pkg', 'yom/history', 'main-pkg'], function(require, $, ajaxHistory, $$) {
	var modKey = 'profile', 
		modName = 'PROFILE', 
		modId = 30300;
	
	var _TMPL = [
		'<div class="block"><div class="blockInner">',
			'<ul class="tabs a">',
				'<li class="a"><a href="/view/about/profile">Profile</a></li>',
				'<li class="b"><a href="/view/about/work">Work</a></li>',
				'<li class="c"><a href="/view/about/contact">Contact</a></li>',
			'</ul>',
			'<p>',
				'Hi, my name is Gary Wang.<br />',
			'</p>',
			'<p>',
				'I\'m living in Shenzhen China, and working as a front-end developer.<br />',
			'</p>',
			'<p>',
				'I love programming in Javascript, CSS, and HTML. Recently I\'m studying Python. I found Python a extramely good programming language, thus I started to build this blog with it.',
			'</p>',
		'</div></div>'
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
	
	Handler.prototype.handle = function(mark, fullMark, reqInfo) {
		if(!this.isCurrentHandler()) {
			return;
		}
		$.css.load(_cssList);
		ajaxHistory.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
		$$.ui.setMainContent($.tmpl.render(_TMPL, {}, {key: 'mod.about.profile'}));
	};
	
	return new Handler({}, modKey, $$.Handler.mod.root.mod.about);
});