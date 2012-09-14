/**
 * webyom namespace
 * @namespace $$
 */
if(!$$) {
	var $$ = {};
}

/**
 * @namespace $$.mod
 */
$$.mod = {};

/**
 * @namespace $$.config
 */
$$.config = (function() {
	var _updater = {};
	var _config = {
		TITLE_POSTFIX: ' - Webyom - Gary\'s Blog',
		MARK_PREFIX: 'view/',
		DEFAULT_MOD_KEY: 'list',
		LIB_NAME_URL_HASH: {
			'YOM_MOUSE_EVENT': '/static/inc/webyom-js/mouse-event.js',
			'YOM_LOCAL_STORAGE': '/static/inc/webyom-js/local-storage.js',
			'YOM_DRAGDROP': '/static/inc/webyom-js/dragdrop.js',
			'YOM_WIDGET_MASK': '/static/inc/webyom-js/widget/mask.js',
			'YOM_WIDGET_DIALOG': '/static/inc/webyom-js/widget/dialog.js',
			'YOM_WIDGET_TOOLTIP': '/static/inc/webyom-js/widget/tooltip.js',
			'PRETTY_PRINT': '/static/inc/prettify/prettify.js'
		},
		MOD_KEY_NAME_HASH: {
			'list': 'ARTICLE_LIST',
			'read': 'READ_ARTICLE'
		},
		MOD_KEY_INFO_HASH: {//p: priority of preload，this bigger p the higher priority。key，id and name must be unique
			'list': {p: 1, key: 'list', title: 'List', id: 300, name: 'ARTICLE_LIST', url: '/static/js/mod/article-list.js'},
			'read': {p: 2, key: 'read', title: 'Read', id: 301, name: 'READ_ARTICLE', url: '/static/js/mod/read-article.js'},
			'write': {p: 3, key: 'write', title: 'Write', id: 302, name: 'WRITE_ARTICLE', url: '/static/js/mod/write-article.js'}
		},
		SUB_MOD_KEY_INFO_HASH: {}
	};
	
	function _update(key) {
		var updaters = _updater[key];
		if(updaters) {
			for(var i = 0, l = updaters.length; i < l; i++) {
				updaters[i].call(null, get(key));
			}
		}
	};
	
	function get(key, updater) {
		if(typeof updater == 'function') {
			_updater[key] = _updater[key] || [];
			_updater[key].push(updater);
		}
		return $.object.clone(_config[key], true);
	};
	
	function set(key, val) {
		_config[key] = val;
		_update(key);
		return 0;
	};
	
	function extend(key, obj) {
		if(typeof _config[key] != 'object') {
			return 1;
		}
		for(var p in obj) {
			_config[key][p] = obj[p];
		}
		_update(key);
		return 0;
	};
	
	return {
		_ID: 200,
		get: get,
		set: set,
		extend: extend
	};
})();

var $$_LIB_NAME_URL_HASH = $$.config.get('LIB_NAME_URL_HASH');
var $$_MOD_KEY_INFO_HASH = $$.config.get('MOD_KEY_INFO_HASH');
var $$_SUB_MOD_KEY_INFO_HASH = $$.config.get('SUB_MOD_KEY_INFO_HASH', function(updated) {
	$$_SUB_MOD_KEY_INFO_HASH = updated;
});
