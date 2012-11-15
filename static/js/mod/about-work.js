define('./about-work.tpl.html', [], function() {
	function $encodeHtml(str) {
		return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, '&#96;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
	};
	return function($data, $opt) {
		$data = $data || {};
		var _$out_= [];
		var $print = function(str) {_$out_.push(str);};
		with($data) {
		_$out_.push('<div class="block"><div class="blockInner"><ul class="tabs b"><li class="a"><a href="/view/about/profile">Profile</a></li><li class="b"><a href="/view/about/work">Work</a></li><li class="c"><a href="/view/about/contact">Contact</a></li></ul><p><a href="https://github.com/webyom/webyom-js" target="_blank">YOM</a> - A JavaScript library which this site built with.</p></div></div>');
		}
		return _$out_.join('');
	};
});

define(['require', 'yom/core/core-built', 'yom/history/history-built', 'main-pkg', './about-work.tpl.html'], function(require, $, ajaxHistory, $$, tmpl) {
	var modKey = 'work', 
		modName = 'WORK', 
		modId = 30301;
	
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
		$$.ui.setMainContent(tmpl({key: 'mod.about.work'}));
	};
	
	return new Handler({}, modKey, $$.Handler.mod.root.mod.about);
});
