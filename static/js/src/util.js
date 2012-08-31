/**
 * @namespace $$.util
 */
$$.util = {};

$$.util.xhr = (function() {
	function _process(opt) {
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
				opt.error && opt.error.call(this, $.Error.getCode($$.util._ID, 1));
				return;
			}
			load && load.call(this, res);
		};
		return opt;
	};
		
	function get(url, opt) {
		opt = _process(opt);
		var xhr = new $.Xhr(url, $extend(opt, {
			method: 'GET'
		}));
		xhr.send();
		return xhr;
	};
	
	function post(url, opt) {
		opt = _process(opt);
		if(typeof opt.param == 'string') {
			opt.param = opt.param + '&csrfmiddlewaretoken=' + $.cookie.get('csrftoken');
		} else {
			opt.param = $extend(opt.param, {csrfmiddlewaretoken: $.cookie.get('csrftoken')});
		}
		var xhr = new $.Xhr(url, $extend(opt, {
			method: 'POST'
		}));
		xhr.send();
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
	}, {silent: 1});
};

$$.util.dialog = (function() {
	var _mask = null;
	var _dialogIdList = [];
	
	function _getDialogZIndex(dialog) {
		return parseInt(dialog.getZIndex()) || 100;
	};
	
	function _getTopDialog() {
		return $.widget.Dialog.getInstanceById(_dialogIdList[0]);
	};
	
	function _onPopup(e) {
		var dialog = $.widget.Dialog.getInstanceById(e.dialogId);
		var topDialog = _getTopDialog();
		if(topDialog) {
			dialog.setZIndex(_getDialogZIndex(topDialog) + 10);
		} else {
			dialog.setZIndex(_getDialogZIndex(dialog));
		}
		_mask.setStyle('z-index', _getDialogZIndex(dialog) - 1);
		_mask.show();
		_dialogIdList.unshift(e.dialogId);
	};
	
	function _onClose(e) {
		for(var i = 0, l = _dialogIdList.length; i < l; i++) {
			if(e.dialogId == _dialogIdList[i]) {
				_dialogIdList.splice(i, 1);
				break;
			}
		}
		if(_dialogIdList.length) {
			_mask.setStyle('z-index', _getDialogZIndex(_getTopDialog()) - 1);
		} else {
			_mask.hide();
		}
	};
	
	function _closeDialog(dialog) {
		dialog && dialog.close();
		var topDialog = _getTopDialog();
		topDialog && dialog != topDialog && topDialog.focus();
	};
	
	function _centralizeAll() {
		$.widget.Dialog.each(function(dialog) {
			dialog.isFixed() && dialog.centralize();
		});
	};
	
	function _init() {
		_mask = new $.widget.Mask();
		_mask.addEventListener('click', function() {
			var topDialog = _getTopDialog();
			topDialog && topDialog.focus();
		});
		$.widget.Dialog.addEventListener('popup', _onPopup);
		$.widget.Dialog.addEventListener('close', _onClose);
		$.Event.addListener(window, 'resize', _mask.resize, _mask);
		$.Event.addListener(window, 'resize', _centralizeAll);
		$.Event.addListener(window, 'scroll', _centralizeAll);
		_init = $empty;
	};
	
	function popup(opt) {
		$.js.require([true, $$_LIB_NAME_URL_HASH['YOM_WIDGET_MASK'], $$_LIB_NAME_URL_HASH['YOM_WIDGET_DIALOG']], function(ret) {
			_init();
			new $.widget.Dialog(opt).popup();
		});
	};
	
	function alert(msg, opt) {
		opt = opt || {};
		opt.closeTimeout = opt.closeTimeout >= 0 ? opt.closeTimeout : 3000;
		popup($extend({
			width: opt.width || 300,
			height: opt.height || 100,
			content: msg,
			contentPadding: 10,
			dragHandles: '[data-type="yom-dialog-footer"]',
			focus: '[data-type="yom-dialog-footer"] button',
			fx: 'fade',
			tips: opt.closeTimeout > 0 ? '{{s}} seconds to close. {{c:cancel}}' : '',
			btns: opt.noBtn ? null : [
				{text: 'Close', className: 'strong', click: function() {
					_closeDialog(this);
				}}
			]
		}, opt));
	};
	
	function confirm(msg, opt) {
		opt = opt || {};
		popup({
			width: opt.width || 300,
			height: opt.height || 100,
			content: msg,
			contentPadding: 10,
			dragHandles: '[data-type="yom-dialog-footer"]',
			focus: '[data-type="yom-dialog-footer"] button',
			fx: 'fade',
			btns: [
				{text: 'Yes', className: 'strong', click: function() {
					_closeDialog(this);
					opt.confirm && opt.confirm();
				}},
				{text: 'No', click: function() {
					_closeDialog(this);
					opt.cancel && opt.cancel();
				}}
			]
		});
	};
	
	return {
		popup: popup,
		alert: alert,
		confirm: confirm
	};
})();

var $$alert = $$.util.dialog.alert;
var $$confirm = $$.util.dialog.confirm;
