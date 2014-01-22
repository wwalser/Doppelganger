(function(root){
	'use strict';
	//main Doppelganger constructor.
	var Doppelganger;

	//Doppelganger objects
	var Filter, Request;

	//Doppelganger utils and selector
	var du, $;

	//useful prototypes.
	var arrayProto = Array.prototype;

	//useful functions.
	var slice = arrayProto.slice;

	//natives
	var nativeIsArray = arrayProto.isArray;
	var nativeForEach = arrayProto.forEach;
	var document = root.document || {};
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
	each: function(obj, iterator, context) {
		if (obj == null) {
			return;
		}
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, length = obj.length; i < length; i++) {
				if (iterator.call(context, obj[i], i, obj) === false){
					return;
				}
			}
		} else {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (iterator(obj[key], key, obj) === false) {
						break;
					}
				}
			}
		}
	},
	isArray: nativeIsArray || function(value) {
		return value && typeof value === 'object' && typeof value.length === 'number' &&
			value.toString() === '[object Array]' || false;
	},
	map: function(collection, callback){
		var index = -1,
			length = collection ? collection.length : 0,
			result = new Array(typeof length === 'number' ? length : 0);
		
		if (du.isArray(collection)) {
			while (++index < length) {
				result[index] = callback(collection[index], index, collection);
			}
		} else {
			du.each(collection, function(value, key, collection) {
				result[++index] = callback(value, key, collection);
			});
		}
		return result;
	},
	$: document.querySelectorAll
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