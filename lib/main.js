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
function getSetRF(name){
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
//@todo: move to filter once they are implemented
function bindRouteEvents(events){
    if (!events) {
		return;
	}
    var doc = $(document);
    du.each(events, function(callback, event){
        var eventName = event.substr(0, event.indexOf(' ')),
        selector = event.substr(eventName.length+1);
		
        doc.on(eventName, selector, callback);
    });
}

Doppelganger.prototype = {
	create: function(appObj){
		for (var key in appObj) {
			this['add' + du.capitolize(key)](appObj[key]);
		}
	},
	init: function(){
		//@todo figure out which route to init.
		this.initRoute();
	},
	//This will be moved to a filter.
	initRoute: function(route){
		bindRouteEvents(route.events);
		//other things to do with initializing a route.
	},
	addRoutes: getSetRF('routes'),
	addRoute: getSetRF('routes'),
	getRoute: getSetRF('routes'),
	addFilters: getSetRF('filters'),
	addFilter: getSetRF('filters'),
	getFilter: getSetRF('filters')
};

