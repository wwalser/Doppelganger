Doppelganger = function(){
	this.routes = {};
	this.filters = {};
};
if ( typeof module === "object" && typeof module.exports === "object" ) {
	module.exports = Doppelganger;
} else {
	root['Doppelganger'] = Doppelganger;
}

//Add routes and filters. 
function geterSetterCreator(name){
	return function(key, value){
		if (typeof key !== "string") {
			du.extend(this[name], key);
		} else if (!value) {
			return this[name][key];
		} else {
			this[name][key] = value;
		}
	};
}

Doppelganger.prototype = {
	create: function(appObj){
		for (var key in appObj) {
			this['add' + du.capitolize(key)](appObj[key]);
		}
	},
	init: function(){
		//do fancy things.
		$(root).on('statechange', function(){
			var state = History.getState();
			//Fire filter chain.
			if (!state.data || !state.data.controllerStateChange) {
				//if controllerStateChange is true a controller has triggered this state change.
				//Otherwise use filter chain.
				root.trigger(state.data.destination, state.data.params);
			}
		});
	},
	addRoutes: geterSetterCreator('routes'),
	addRoute: geterSetterCreator('routes'),
	getRoute: geterSetterCreator('routes'),
	addFilters: geterSetterCreator('filters'),
	addFilter: geterSetterCreator('filters'),
	getFilter: geterSetterCreator('filters'),

    navigate: function(){
        //on initial load fire filter chain. On subsequent calls push state and the statechange handler will fire filters.
        root.navigate = function(name, params){
            //if pushstate, just use a full page reload.
            if (history.pushState) {
                History.pushState({destination: name, params: params}, document.title, root.helpers.routing.generate(name, params));
            } else {
                root.location = root.helpers.routing.generate(name, params);
            }
        };
        root.helpers.filterManager.process();
    },

	/**
     * Ideally this is relatively unused. The navigate method could just handle whether something is a refresh or a
     * navigation change, but History.js doesn't fire a statechange if it's just a refresh so we need some way to 
	 * invoke the filter manager. This can also be useful for UI state transitions which want to take advantage of
	 * filter functionality without changing the URL.
     * @param name
     * @param params
     */
    trigger: function (name, params) {
        root.helpers.filterManager.process({ destination: name, params: params });
    },
    updateContent: function (html) {
        var $pageContent = $(this.PAGE_CONTENT_SELECTOR);
        $pageContent.children().not('.' + root.UMFlashMessage.messageClass).remove();
        return $pageContent.append(html);
    }
};

