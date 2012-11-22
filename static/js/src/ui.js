/**
 * @namespace $$.ui
 */
define(['require', 'yom/core/core-built', './storage', './tooltip'], function(require, $, storage, tooltip) {
	var _USER_NAME = window.$$userName
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
			FRAME: window.$$uiContentTmpl,
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
		FOOTER : '<span>&copy;2009-2011 Webyom. Designed and Programmed by <a href="mailto:webyom@gmail.com" title="Write a mail to Gary.">Gary</a>. Powered by <a href="http://www.djangoproject.com" target="_blank">Django</a> and <a href="http://github.com/webyom/yom" target="_blank">YOM</a></span><img src="/static/img/django-logo.gif" alt="Powered by Django" /><br class="clearFix" />'
	}
	
	var _sortable = null
	
	function _initHeader() {
		var tweening = false
		$('#header').get().innerHTML = _TMPL['HEADER']
		$('h1').addEventListener('mouseover', function() {
			if(tweening) {
				return
			}
			tweening = true
			$('h1').setStyle('position', 'relative').
			tween(500, {target: {style: 'bottom: 80px;'}, transition: 'easeOut'}).tweenWait(500).
			tween(500, {target: {style: 'bottom: 0;'}, transition: 'easeIn'}).tweenWait(500).
			tween(200, {prior: true, target: {style: 'bottom: 20px;'}, transition: 'easeOut'}).tweenWait(200).tween(200, {prior: true, target: {style: 'bottom: 0;'}, transition: 'easeIn'}).tweenWait(200).
			tween(100, {prior: true, target: {style: 'bottom: 10px;'}, transition: 'easeOut'}).tweenWait(100).tween(100, {prior: true, target: {style: 'bottom: 0;'}, transition: 'easeIn'}).tweenWait(100).
			tween(50, {prior: true, target: {style: 'bottom: 5px;'}, transition: 'easeOut'}).tweenWait(50).
			tween(50, {prior: true, target: {style: 'bottom: 0;'}, transition: 'easeIn', complete: function() {tweening = false;}})
		})
	}
	
	function _initContent() {
		resetContent()
	}
	
	function _initFooter() {
		$('#footer').get().innerHTML = _TMPL['FOOTER']
	}
	
	function resetContent() {
		$('#content').setHtml(_TMPL['CONTENT']['FRAME'])
		storage.get('sideModSequence', function(res) {
			if(res) {
				$.object.each(res.split(' '), function(modId) {
					$('[data-mod-id="' + modId + '"]', '#sidePart').appendTo($('#sidePart'))
				})
			}
			$('#sideWhoamiContent').get().innerHTML = _TMPL['CONTENT']['SIDE_WHOAMI']
			$('#sideReadingsContent').get().innerHTML = _TMPL['CONTENT']['SIDE_READINGS']
			$('#sideRecSites').get().innerHTML = _TMPL['CONTENT']['SIDE_REC_SITES']
		})
		require(['yom/dragdrop/dragdrop-built'], function(dragdrop) {
			try {
				_sortable && _sortable.destory()
			} catch(e) {}
			_sortable = new dragdrop.Sortable('#sidePart .sortable', {cloneContainer: $('#sidePart'), handles: '.handle', enterDirection: 'V', boundary: 'PAGE', snap: 0, startOff: {left: 5, top: 5}, clone: 0})
			_sortable.addEventListener('sortrelease', function() {
				var tmp = []
				$('#sidePart .sortable').each(function(el) {
					tmp.push($(el).getDatasetVal('mod-id'))
				})
				storage.set('sideModSequence', tmp.join(' '))
			})
		})
		return this
	}
	
	function setContent(content) {
		$('#content').setHtml(content).fadeIn()
		return this
	}
	
	function setMainContent(content) {
		$('#mainPart').size() || resetContent()
		$('#mainPart').setHtml(content).fadeIn()
		return this
	}
	
	function turnOnMenu(name) {
		$('#menu').get().className = name
		return this
	}
	
	function init() {
		_initHeader()
		_initContent()
		_initFooter()
		tooltip.bindAttr({attr: 'title', maxBubble: 2})
		return this
	}
	
	var processing = (function() {
		var _div
		
		function isAnyLoading() {
			return $.JsLoader.isAnyLoading() || $.Xhr.isAnyLoading() || $.CrossDomainPoster.isAnyLoading()
		}
		
		function start(msg) {
			_div.innerHTML = msg || 'Processing...'
			_div.style.display = 'block'
			document.getElementById('content').className = 'processing'
		}
		
		function stop() {
			_div.style.display = 'none'
			document.getElementById('content').className = ''
		}
		
		;(function() {
			_div = document.body.appendChild($.Element.create('div', {id: 'processingDiv'}, {display: 'none'}))
			$.JsLoader.addEventListener('start', function(e) {
				if(e.opt.silent) {
					return
				}
				start()
			})
			$.JsLoader.addEventListener('allcomplete', function(e) {
				if(!isAnyLoading()) {
					stop()
				}
			})
			$.Xhr.addEventListener('start', function(e) {
				if(e.opt.silent) {
					return
				}
				start()
			})
			$.Xhr.addEventListener('allcomplete', function(e) {
				if(!isAnyLoading()) {
					stop()
				}
			})
			$.CrossDomainPoster.addEventListener('start', function(e) {
				if(e.opt.silent) {
					return
				}
				start()
			})
			$.CrossDomainPoster.addEventListener('allcomplete', function(e) {
				if(!isAnyLoading()) {
					stop()
				}
			})
		})()
		
		return {
			isAnyLoading: isAnyLoading,
			start: start,
			stop: stop
		}
	})()
	
	return {
		resetContent: resetContent,
		setContent: setContent,
		setMainContent: setMainContent,
		turnOnMenu: turnOnMenu,
		init: init,
		processing: processing
	}
})

