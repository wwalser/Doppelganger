var defaults = {
	filters: ['EventFilter', 'RouterFilter'],
	routes: {'index': ''}
};
var defaultAppObjectFields = {'routes': 'routeManager', 'filters': 'filterManager'};
Doppelganger.prototype = {
	create: function(appObj){
		var field, propertyValue;
		this.options = du.extend({}, defaults, appObj.options);
		this.filterManager = new Doppelganger.FilterManager(this);
		this.routeManager = new Doppelganger.RouteManager(this, appObj.rootUrl);
		for (var property in defaultAppObjectFields) {
			if (defaultAppObjectFields.hasOwnProperty(property)){
				field = defaultAppObjectFields[property];
				propertyValue = appObj[property] || this.options[property];
				this[field]['add'](appObj[property]);
			}
		}
		return this;
	},
	init: function(){
		var self = this;
		//do fancy things.
		History.Adapter.bind(window,'statechange', function(){
			var state = History.getState();
			//Fire filter chain.
			if (!state.data || !state.data.controllerStateChange) {
				//if controllerStateChange is true a controller has triggered this state change.
				//Otherwise use filter chain.
				self.trigger(state.data.destination, state.data.params);
			}
		});
		this.startPage = du.extend({}, this.routeManager.recognize(window.location.pathname));
		this.startPage.params = du.extend(this.startPage.params, Arg.all());
		this.navigate();
	},

	navigate: function(){
		//on initial load fire filter chain. On subsequent calls push state and the statechange handler will fire filters.
		this.navigate = function(name, params){
			//if pushstate, just use a full page reload.
			if (history.pushState) {
				History.pushState({destination: name, params: params}, document.title, this.routeManager.generate(name, params));
			} else {
				root.location = root.helpers.routing.generate(name, params);
			}
		};
		if (this.startPage) {
			//if the page that we are on is a valid route we can show that page
			this.filterManager.process(this.startPage);
		} else {
			//otherwise we've navigated somewhere that delivered the application but isn't
			//a valid route, navigate to the defaultRoute.
			this.navigate(this.options.defaultRoute[0], this.options.defaultRoute[1]);
		}
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

Doppelganger.RouteHandlers = {};
Doppelganger.setRouteHandler = du.getterSetterCreator('RouteHandlers');
Doppelganger.getRouteHandler = du.getterSetterCreator('RouteHandlers');

Doppelganger.FilterHandlers = {};
Doppelganger.setFilterHandler = du.getterSetterCreator('FilterHandlers');
Doppelganger.getFilterHandler = du.getterSetterCreator('FilterHandlers');
