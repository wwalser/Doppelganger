(function(root){
	//main Doppelganger constructor.
	var Doppelganger;

	//convenience variables.
	var du, $;

	//useful prototypes.
	var arrayProto = Array.prototype;

	//useful functions.
	var slice = arrayProto.slice;
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


Doppelganger.util = du = {
	capitolize: function(str){
		return str.charAt(0).toUpperCase() + str.slice(1);
	},
	extend: function(obj){
		var iterable = slice.call(arguments, 1),
			source, i, prop;
		for (i = 0; i < iterable.length; i++) {
			source = iterable[i];
			if (source) {
				for (prop in source) {
					obj[prop] = source[prop];
				}
			}
		}
		return obj;
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
};
$ = du.$;

})(this);