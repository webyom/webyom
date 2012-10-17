/**
 * @namespace $$.storage
 */
define('main/storage', ['require'], function(require) {
	function _do(cb) {
		require(['yom/local-storage'], function(ls) {
			cb(ls);
		});
	};
	
	function get(key, cb) {
		_do(function(ls) {
			ls.get(key, {proxy: 1, callback: function(res) {
				cb(res);
			}});
		});
	};
	
	function set(key, val, cb) {
		_do(function(ls) {
			ls.set(key, val, {proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function remove(key, cb) {
		_do(function(ls) {
			ls.remove(key, {proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function clear(cb) {
		_do(function(ls) {
			ls.clear({proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function doUnlessKey(key, cb, opt) {
		opt = opt || {};
		get(key, function(val) {
			if(val || opt.test && opt.test(val)) {
				return;
			}
			cb();
			if(typeof opt.set == 'function') {
				val = opt.set(val);
				val === false || set(key, val);
			} else if(opt.set) {
				set(key, opt.set);
			}
		});
	};
	
	return {
		get: get,
		set: set,
		remove: remove,
		clear: clear,
		doUnlessKey: doUnlessKey
	};
});
