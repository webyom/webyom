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
			'WYJS_MOUSE_EVENT': '/static/inc/webyom-js/mouse_event.js',
			'PRETTY_PRINT': '/static/inc/prettify/prettify.js'
		},
		MOD_NAME_URL_HASH: {
			'ARTICLE_LIST': '/static/js/mod/article_list.js',
			'READ_ARTICLE': '/static/js/mod/read_article.js'
		},
		MOD_KEY_NAME_HASH: {
			'list': 'ARTICLE_LIST',
			'read': 'READ_ARTICLE'
		},
		MOD_KEY_INFO_HASH: {//p: 预加载优先级，p越大优先级越高。
			'list': {p: 1, key: 'list', title: 'List', id: 300, name: 'ARTICLE_LIST', url: '/static/js/mod/article_list.js'},
			'read': {p: 2, key: 'read', title: 'Read', id: 301, name: 'READ_ARTICLE', url: '/static/js/mod/read_article.js'},
			'write': {p: 3, key: 'write', title: 'Write', id: 302, name: 'WRITE_ARTICLE', url: '/static/js/mod/write_article.js'}
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
		return $.object.clone(_config[key]);
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
