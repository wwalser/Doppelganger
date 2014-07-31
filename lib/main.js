var defaults = {
	rootUrl: '',
	routes: [{name: 'index', url: ''}],
	filters: ['RouterFilter', 'EventFilter']
};
var defaultAppObjectFields = {'routes': 'routeManager', 'filters': 'filterManager'};

/**
 * Create a new Doppelganger application.
 */
Doppelganger.create = function(appObj){
	var app = new Doppelganger();
	var field, propertyValue;
	app.options = du.extend({}, defaults, appObj);
	app.filterManager = new Doppelganger.FilterManager(app);
	app.routeManager = new Doppelganger.RouteManager(app, app.options.rootUrl);
	//Setup routes and filters that this application will use
	for (var property in defaultAppObjectFields) {
		if (defaultAppObjectFields.hasOwnProperty(property)){
			//respective handler for this property type [ex: 'filterManager']
			field = defaultAppObjectFields[property];
			//if the value isn't provided, fallback to defaults [ex: defaults.filters]
			propertyValue = app.options[property];
			//call the add method on respective handler [ex: app.filterManager.add(defaults.filters)]
			app[field]['add'](propertyValue);
		}
	}
	if (app.options.urlCoerceMode === false) {
		Arg.coerceMode = false;
	}
	return app;
};

Doppelganger.prototype = {
	init: function(){
		var self = this;
		//do fancy things.
		this.active = true;
		History.Adapter.bind(window,'statechange', function(){
			var state = History.getState();
			if (self.active && !state.data.controllerStateChange) {
				//if controllerStateChange is true a controller has triggered this state change.
				//Otherwise use filter chain.
				if (state.data.destination) {
					self.trigger(state.data.destination, state.data.params);
				} else if (!state.data.destination) {
					self.trigger(self.startPage.destination, self.startPage.params);
				}
			}
		});
		this.startPage = this.routeManager.recognize(window.location.pathname);
		this.navigate();
	},

	_destroy: function(){
		this.active = false;
	},

	navigate: function(){
		//on initial load fire filter chain. On subsequent calls push state and the statechange handler will fire filters.
		this.navigate = function(name, params){
			if (params.replace) {
				delete params.replace;
				this._replace(name, params);
			} else {
				this._push(name, params);
			}
		};

		if (this.startPage) {
			//if the page that we are on is a valid route we can show that page
			this.startPage = du.extend({}, this.startPage);
			//ugly global variable from Arg.js that removes it's caches.
			this.startPage.params = du.extend(this.startPage.params, Arg.all());
			this.trigger(this.startPage.destination, this.startPage.params);
		} else {
			//otherwise we've navigated somewhere that delivered the application but isn't
			//a valid route, navigate to the defaultRoute.
			this.navigateDefault();
		}
	},

	navigateDefault: function(){
		var name = this.options.defaultRoute[0];
		var params = this.options.defaultRoute[1];
		this._replace(name, params);
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
	},
	_push: function (name, params) {
		//if no pushstate, just use a full page reload.
		if (history.pushState) {
			History.pushState({ destination: name, params: params }, document.title, this.routeManager.generate(name, params));
		} else {
			root.location = this.routeManager.generate(name, params);
		}
	},
	_replace: function (name, params) {
		//if no replacestate, just use a full page reload.
		if (history.replaceState) {
			History.replaceState({ destination: name, params: params }, document.title, this.routeManager.generate(name, params));
		} else {
			root.location = this.routeManager.generate(name, params);
		}
	}
};

Doppelganger.RouteHandlers = {};
Doppelganger.setRouteHandler = du.getterSetterCreator('RouteHandlers');
Doppelganger.getRouteHandler = du.getterSetterCreator('RouteHandlers');

Doppelganger.FilterHandlers = {};
Doppelganger.setFilterHandler = du.getterSetterCreator('FilterHandlers');
Doppelganger.getFilterHandler = du.getterSetterCreator('FilterHandlers');
