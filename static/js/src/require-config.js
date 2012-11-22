var require = require || {
	baseUrl: 'http://www.webyom.org/static/js',
	path: {
		'yom': 'lib/yom',
		'require-plugin': 'lib/yom/require-plugin',
		'prettify': 'lib/prettify/prettify'
	},
	shim: {
		'prettify': {
			exports: 'prettyPrint'
		}
	},
	source: {
		YUI: {
			baseUrl: 'http://yui.yahooapis.com/2.7.0/build',
			shim: {
				'yahoo-dom-event/yahoo-dom-event': {
					exports: 'YAHOO.util.Event'
				},
				'element/element-min': {
					deps: [
						'yahoo-dom-event/yahoo-dom-event'
					],
					exports: 'YAHOO.util.Element'
				},
				'container/container_core-min': {
					deps: [
						'yahoo-dom-event/yahoo-dom-event'
					],
					exports: 'YAHOO.widget.Module'
				},
				'menu/menu-min': {
					deps: [
						'yahoo-dom-event/yahoo-dom-event'
					],
					exports: 'YAHOO.widget.Menu'
				},
				'button/button-min': {
					deps: [
						'yahoo-dom-event/yahoo-dom-event'
					],
					exports: 'YAHOO.widget.Button'
				},
				'editor/editor-min': {
					deps: [
						'yahoo-dom-event/yahoo-dom-event', 
						'element/element-min', 
						'container/container_core-min', 
						'menu/menu-min', 
						'button/button-min'
					],
					exports: 'YAHOO.widget.Editor'
				}
			}
		}
	},
	errCallback: function(code) {
		var msg = 'Require error code: ' + code
		require(['main-pkg'], function($$) {
			$$alert(msg)
		}, function() {
			alert(msg)
		})
	},
	onLoadStart: function() {
		require(['main-pkg'], function($$) {
			$$.ui.processing.start()
		})
	},
	onLoadEnd: function() {
		require(['main-pkg'], function($$) {
			$$.ui.processing.isAnyLoading() || $$.ui.processing.stop()
		})
	},
	waitSeconds: 30
}

