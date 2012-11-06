/**
 * @namespace $$
 */
define(function(require) {
	var $$ = {
		config: require('./config'),
		storage: require('./storage'),
		tooltip: require('./tooltip'),
		ui: require('./ui'),
		util: require('./util'),
		Handler: require('./handler')
	};
	
	return $$;
});
