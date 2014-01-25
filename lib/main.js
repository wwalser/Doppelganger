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
function getterSetterCreator(name){
	return function(key, value){
		if (typeof key !== "string") {
			if (du.isArray(key)) {
				this[name].concat(key);
			} else {
				du.extend(this[name], key);
			}
		} else if (!value) {
			return this[name][key];
		} else {
			this[name][key] = value;
		}
	};
}

var autoAddFields = ['routes', 'filters'];
Doppelganger.prototype = {
	create: function(appObj){
		var length = autoAddFields.length,
			i = 0,
			field;
		for (; i < length; i++) {
			field = autoAddFields[i];
			if (appObj[field]) {
				this['add' + du.capitolize(field)](appObj[field]);
				delete appObj[field];
			}
		}
		this.request = new Doppelganger.Request(this);
		this.filterManager = new Doppelganger.FilterManager(this);
		this.router = new Doppelganger.Router(appObj.rootUrl, appObj.routerOptions);
	},
	init: function(){
		var self = this;
		//do fancy things.
		du.addEvent(window, 'statechange', function(){
			var state = History.getState();
			//Fire filter chain.
			if (!state.data || !state.data.controllerStateChange) {
				//if controllerStateChange is true a controller has triggered this state change.
				//Otherwise use filter chain.
				self.trigger(state.data.destination, state.data.params);
			}
		});
		this.startPage = this.router.recognize(window.location.pathname);
	},
	addRoutes: getterSetterCreator('routes'),
	addRoute: getterSetterCreator('routes'),
	getRoute: getterSetterCreator('routes'),
	addFilters: getterSetterCreator('filters'),
	addFilter: getterSetterCreator('filters'),
	getFilter: getterSetterCreator('filters'),

	navigate: function(){
		//on initial load fire filter chain. On subsequent calls push state and the statechange handler will fire filters.
		this.navigate = function(name, params){
			//if pushstate, just use a full page reload.
			if (history.pushState) {
				History.pushState({destination: name, params: params}, document.title, root.helpers.routing.generate(name, params));
			} else {
				root.location = root.helpers.routing.generate(name, params);
			}
		};
		this.filterManager.process(this.request);
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
		this.filterManager.process({ destination: name, params: params });
	},
	updateContent: function (html) {
		var $pageContent = $(this.PAGE_CONTENT_SELECTOR);
		//@todo remove this comment when after createing a filter that removes these in UM.
		//$pageContent.children().not('.' + root.UMFlashMessage.messageClass).remove();
		return $pageContent.append(html);
	}
};

