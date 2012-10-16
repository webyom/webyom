/**
 * @namespace $$.config
 */
define('main/config', ['require', 'yom/core-pkg'], function(require, $) {
	var _updater = {};
	var _config = {
		TITLE_POSTFIX: 'Webyom - Gary\'s Blog',
		MARK_PREFIX: 'view/',
		DEFAULT_MOD_KEY: 'list',
		MOD_KEY_NAME_HASH: {
			'list': 'ARTICLE_LIST',
			'read': 'READ_ARTICLE'
		},
		MOD_KEY_INFO_HASH: {//p: priority of preload，this bigger p the higher priority。key，id and name must be unique
			'list': {p: 1, key: 'list', title: 'List', id: 300, name: 'ARTICLE_LIST', url: 'mod/article-list'},
			'read': {p: 2, key: 'read', title: 'Read', id: 301, name: 'READ_ARTICLE', url: 'mod/read-article'},
			'write': {p: 3, key: 'write', title: 'Write', id: 302, name: 'WRITE_ARTICLE', url: 'mod/write-article'},
			'about': {p: 4, key: 'about', title: 'About', id: 303, name: 'ABOUT', url: 'mod/about'}
		}
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
});
