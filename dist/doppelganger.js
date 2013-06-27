(function(root){
	'use strict';
	//main Doppelganger constructor.
	var Doppelganger;

	//Doppelganger objects
	var Filter, Request;

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

Doppelganger.prototype = {
	create: function(appObj){
		for (var key in appObj) {
			this['add' + du.capitolize(key)](appObj[key]);
		}
	},
	init: function(){
		//do fancy things.
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

Doppelganger.Request = Request = function(app){
	this.app = app;
};
Doppelganger.Request.prototype = {
	/**
	 * Sets a single query param key and value
	 */
	setQueryParam: function(key, value){
        if (value.length === 0) {
            delete this.query[key];
        } else {
            this.query[key] = value;
        }
    },
	/**
	 * Returns the query object
	 */
	getQuery: function(){
        return this.query;
    },
	/**
	 * Sets the query object
	 */
	setQuery: function(obj){
		this.query = obj;
	},
	/**
	 * Builds a query string from the query object
	 */
	buildQueryString: function(){
        var queryString = "";
        $.each(this.getQuery(), function(key, value){
            queryString += (encodeURIComponent(key) + "=" + encodeURIComponent(value));
			queryString += '&';
        });
        return queryString.length ? '?' + queryString.slice(0,-1) : queryString;
    }
};

//Namespace for all of Doppelganger's built in Filters.
Doppelganger.Filters = {};
//Constructor for a filters.
Doppelganger.Filter = Filter = function(name, filter){
	this.name = name;
	this.filter = filter;
};

Filter.prototype = {
	sayName: function(){
		return this.name;
	},
	apply: function(app, request){
		this.filter.call(app, request);
	}
};
Doppelganger.Filters.LocationFilter = new Filter('Location', function(request){
	var location;
	request.location = location = root.location;
	//In case we're using Doppelganger in an environment without a global variable
	if (location) {
		request.search = root.location.search;
		request.pathName = root.location.pathname;
	}
});

Doppelganger.Filters.QueryStringFilter = new Filter('QueryString', function(request){
	var search = request.search,
		splitSearch = search.slice(1).split('&'),
		query = {};
	
    if (search !== "") {
        $.each(splitSearch, function(i, paramString){
            var paramPair = paramString.split('=');
            query[paramPair[0]] = paramPair[1];
        });
    }
    request.setQuery(query);
});

Doppelganger.Filters.RouterFilter = new Filter('Router', function(request){
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
	bindRouteEvents({'click a': function(){
		//faked for grunt build.
		console.log(request);
	}});
});

})(this);