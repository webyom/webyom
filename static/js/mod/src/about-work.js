(function(modKey, modName, modId) {
	var _TMPL = [
		'This is Gary\'s work...'
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
				$('#aboutContent').setHtml($.tmpl.render(_TMPL, {}, {key: 'mod.about.work'}));
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
})('work', 'WORK', 30300);