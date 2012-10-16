/**
 * @namespace $$
 */
define(function(require) {
	var $$ = {
		config: require('main/config'),
		storage: require('main/storage'),
		tooltip: require('main/tooltip'),
		ui: require('main/ui'),
		util: require('main/util'),
		Handler: require('main/handler')
	};
	
	return $$;
});
