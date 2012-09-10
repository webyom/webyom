/**
 * @namespace $$.storage
 */
$$.storage = (function() {
	function _do(cb) {
		$.js.require($$.LIB_NAME_URL_HASH['YOM_LOCALSTORAGE'], function(ret) {
			cb();
		});
	};
	
	function get(key, cb) {
		_do(function() {
			$.localStorage.get(key, {proxy: 1, callback: function(res) {
				cb(res);
			}});
		});
	};
	
	function set(key, val, cb) {
		_do(function() {
			$.localStorage.set(key, val, {proxy: 1, callback: function(res) {
				cb && cb(res);
			}});
		});
	};
	
	function remove(key, cb) {
		_do(function() {
			$.localStorage.clear(key, {proxy: 1, callback: function(res) {
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
		doUnlessKey: doUnlessKey
	};
})();
