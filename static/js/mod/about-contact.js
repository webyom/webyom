(function(modKey, modName, modId) {
	var _TMPL = [
		'<div class="block"><div class="blockInner">',
			'<ul class="tabs c">',
				'<li class="a"><a href="/view/about/profile">Profile</a></li>',
				'<li class="b"><a href="/view/about/work">Work</a></li>',
				'<li class="c"><a href="/view/about/contact">Contact</a></li>',
			'</ul>',
			'<p>',
				'Email: webyom@gmail.com<br />',
				'QQ: 251830327',
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
		$.history.ajax.setMark(fullMark, [reqInfo.modInfo.title, $$.config.get('TITLE_POSTFIX')].join(' - '));
		$('#mainPart').tween(1000, {
			origin: {
				style: 'left: 0px; opacity: 1; position: relative;'
			},
			target: {
				style: 'left: -300px; opacity: 0; position: relative;'
			},
			css: true,
			prior: true,
			transition: 'easeOut',
			complete: function() {
				$('#mainPart').setHtml($.tmpl.render(_TMPL, {}, {key: 'mod.about.contact'}));
				$('#mainPart').tween(1000, {
					origin: {
						style: 'left: -300px; opacity: 0; position: relative;'
					},
					target: {
						style: 'left: 0px; opacity: 1; position: relative;'
					},
					css: true,
					transition: 'easeOut'
				});
			}
		});
	};
	
	new Handler({}, modKey, $$.mod.root.mod.about);
})('contact', 'CONTACT', 30302);
