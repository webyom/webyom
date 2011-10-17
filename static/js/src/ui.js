/**
 * @namespace $$.ui
 */
$$.ui = (function() {
	var _USER_NAME = $$userName;
	var _TMPL = {
		HEADER: [
			'<h1>Webyom</h1>', 
			'<ul id="menu">', 
				'<li class="a"><a href="/view/list">Blog</a></li>', 
				//'<li class="b"><a href="/#work">My Work</a></li>', 
				'<li class="b"><a href="/view/bookmark">Bookmark</a></li>', 
				'<li class="c"><a href="/view/about">About</a></li>', 
			'</ul>', 
			'<div id="loginInfo">' + (_USER_NAME ? 'Welcome, ' + _USER_NAME + '! <a href="/logout/">logout&gt;&gt;</a>' : 'Welcome, guest!') + '</div>'
		].join(''),
		CONTENT: {
			FRAME: $$uiContentTmpl,
			SIDE_WHOAMI: [
				'<p>', 
					'<img src="/static/img/myPhoto.jpg" alt="Who am I?" />', 
					'Hi, my name is Gary Wang.<br /><br />', 
					'I\'m living in Shenzhen China, and working as a front-end developer.<br /><br />', 
					'I love programming in Javascript, CSS, and HTML. Recently I\'m studying Python. I found Python a extramely good programming language, thus I started to build this blog with it.', 
				'</p>'
			].join(''),
			SIDE_READINGS: [
				'<ul>', 
					'<li><a href="http://www.amazon.com/Learning-Website-Development-Django-applications/dp/1847193358" target="_blank">Learn Website Development with Django<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
					'<li><a href="http://www.amazon.com/Passionate-Programmer-Remarkable-Development-Pragmatic/dp/1934356344" target="_blank">The Passionate Programmer<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
				'</ul>'
			].join(''),
			SIDE_REC_SITES: [
				'<ul>', 
					'<li><a href="http://isd.tencent.com/" target="_blank">Tencent ISD<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
					'<li><a href="http://cdc.tencent.com/" target="_blank">Tencent CDC<img src="/static/img/blank.gif" class="iconOutGoing" alt="Link to outside." /></a></li>', 
				'</ul>'
			].join('')
		},
		FOOTER : '<span>&copy;2009-2011 Webyom. Designed and Programmed by <a href="mailto:webyom@gmail.com" title="Write a mail to Gary.">Gary</a></span><img src="/static/img/django_logo.gif" alt="Powered by Django" /><br class="clearFix" />'
	};
	
	function _initHeader() {
		$('#header').get().innerHTML = _TMPL['HEADER'];
		$('#header').tween(1500, {
			origin: {
				style: 'opacity: 0;'
			},
			target: {
				style: 'left: 0px; opacity: 1;'
			},
			transition: 'easeOut'
		});
	};
	
	function _initContent() {
		resetContent();
	};
	
	function _initFooter() {
		$('#footer').get().innerHTML = _TMPL['FOOTER'];
	};
	
	function resetContent() {
		$('#content').get().innerHTML = _TMPL['CONTENT']['FRAME'];
		$('#sideWhoamiContent').get().innerHTML = _TMPL['CONTENT']['SIDE_WHOAMI'];
		$('#sideReadingsContent').get().innerHTML = _TMPL['CONTENT']['SIDE_READINGS'];
		$('#sideRecSites').get().innerHTML = _TMPL['CONTENT']['SIDE_REC_SITES'];
		$('#sidePart').tween(1500, {
			origin: {
				style: 'top: -800px; opacity: 0; position: relative;'
			},
			target: {
				style: 'top: 0px; opacity: 1; position: static;'
			},
			transition: 'easeOut'
		});
	};
	
	function turnOnMenu(name) {
		$('#menu').get().className = name;
	};
	
	function init() {
		$(document.body).show();
                _initHeader();
		_initContent();
		_initFooter();
	};
	
	return {
		resetContent: resetContent,
		turnOnMenu: turnOnMenu,
                init: init
	};
})();

/**
 * @namespace $$.ui.processing
 */
$$.ui.processing = (function() {
	var _div;
	
	function start(msg) {
		_div.innerHTML = msg || 'Processing...';
		_div.style.display = 'block';
		document.getElementById('content').className = 'processing';
	};
	
	function stop() {
		_div.style.display = 'none';
		document.getElementById('content').className = '';
	};
	
	(function() {
		_div = document.body.appendChild($.Element.create('div', {id: 'processingDiv'}, {display: 'none'}));
		$.JsLoader.addEventListener('start', function(e) {
			start();
		});
		$.JsLoader.addEventListener('allcomplete', function(e) {
			stop();
		});
		$.Xhr.addEventListener('start', function(e) {
			start();
		});
		$.Xhr.addEventListener('allcomplete', function(e) {
			stop();
		});
	})();
	
	return {
		start: start,
		stop: stop
	};
})();
