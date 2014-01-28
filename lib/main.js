Doppelganger = function(){
	this.routes = {};
	this.filters = {};
};
if ( typeof module === "object" && typeof module.exports === "object" ) {
	module.exports = Doppelganger;
} else {
	root['Doppelganger'] = Doppelganger;
}

var defaultAppObjectFields = {'routes': 'router', 'filters': 'filterManager'};
Doppelganger.prototype = {
	create: function(appObj){
		var field;
		this.filterManager = new Doppelganger.FilterManager(this);
		this.router = new Doppelganger.Router(appObj.rootUrl, appObj.routerOptions);
		for (var property in defaultAppObjectFields) {
			if (defaultAppObjectFields.hasOwnProperty(property)){
				field = defaultAppObjectFields[property];
				this[field]['add'](appObj[property]);
			}
		}
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
		this.navigate();
	},

	navigate: function(){
		//on initial load fire filter chain. On subsequent calls push state and the statechange handler will fire filters.
		this.navigate = function(name, params){
			//if pushstate, just use a full page reload.
			if (history.pushState) {
				History.pushState({destination: name, params: params}, document.title, this.router.generate(name, params));
			} else {
				root.location = root.helpers.routing.generate(name, params);
			}
		};
		this.filterManager.process(this.startPage);
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

