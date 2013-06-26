(function(root){
	//main Doppelganger constructor.
	var Doppelganger;

	//convenience variables.
	var du, $;

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
function addRF(name){
	return function(key, value){
		if (typeof key !== "string") {
			du.extend(this[name], key);
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
	create: function(){
		
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
	addRoutes: addRF('routes'),
	addRoute: addRF('routes'),
	addFilters: addRF('filters'),
	addFilter: addRF('filters'),
};


Doppelganger.util = du = {
	extend: function(){
		//$.extend
	},
	each: function(){
		//_.each
	},
	map: function(){
		//_.map
	},
	$: function(){
		//selector engine
	},
	partial: function(){
		//_.partial
	}
};
$ = du.$;

})(this);