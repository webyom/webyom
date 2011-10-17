/**
 * @namespace $$.util
 */
$$.util = {};

$$.util.xhr = (function() {
	function _process(xhr, opt) {
		opt = opt || {};
		var load = opt.load;
		opt.load = function(res) {
			var cbn = opt.callbackName || '_callBack';
			if(!new RegExp('^\\s*' + cbn).test(res)) {
				res = cbn + '(' + res + ')';
			}
			try {
				res = (new Function(['var res = {}, ', cbn, ' = function (r) { res = r; }; ', res, '; return res'].join('')))();
			} catch(e) {
				opt.error.call(this, $.Error.getCode($$.util._ID, 1));
				return;
			}
			load && load.call(this, res);
		};
		xhr.send();
	};
		
	function get(url, opt) {
		var xhr = new $.Xhr(url, $extend(opt, {
			method: 'GET'
		}));
		_process(xhr, opt);
		return xhr;
	};
	
	function post(url, opt) {
		opt = opt || {};
		if(typeof opt.param == 'string') {
			opt.param = opt.param + '&csrfmiddlewaretoken=' + $.cookie.get('csrftoken');
		} else {
			opt.param = $extend(opt.param, {csrfmiddlewaretoken: $.cookie.get('csrftoken')});
		}
		var xhr = new $.Xhr(url, $extend(opt, {
			method: 'POST'
		}));
		_process(xhr, opt);
		return xhr;
	};
	
	return {
		get: get,
		post: post
	};
})();

$$.util.prettyPrint = function() {
	$.js.require($$_LIB_NAME_URL_HASH['PRETTY_PRINT'], function() {
		prettyPrint();
	});
};
