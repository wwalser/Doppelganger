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
	var nativeIndexOf = arrayProto.indexOf;
	var document = root.document || {};

	//Supplied by dependencies
	var Sherpa = Sherpa || {Router: function(){}};
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
		du.addEvent(window, 'statechange', function(){
			var state = History.getState();
			//Fire filter chain.
			if (!state.data || !state.data.controllerStateChange) {
				//if controllerStateChange is true a controller has triggered this state change.
				//Otherwise use filter chain.
				root.trigger(state.data.destination, state.data.params);
			}
		});
		this.startPage = router.recognize(window.location.pathname);
	},
	addRoutes: getterSetterCreator('routes'),
	addRoute: getterSetterCreator('routes'),
	getRoute: getterSetterCreator('routes'),
	addFilters: getterSetterCreator('filters'),
	addFilter: getterSetterCreator('filters'),
	getFilter: getterSetterCreator('filters'),

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
	indexOf: function(array, item) {
		if (array == null) {
			return -1;
		}
		var i = 0, length = array.length;
		if (nativeIndexOf && array.indexOf === nativeIndexOf) {
			return array.indexOf(item);
		}
		for (; i < length; i++) {
			if (array[i] === item) {
				return i;
			}
		}
		return -1;
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
	$: document.querySelectorAll,
	matchesSelector: function(elem, selector) {
		var fragment, elems;
		//use native otherwise querySelectorAll from parent node.
		if (elem.matchesSelector) {
			return elem.matchesSelector(selector);
		}
		// append to fragment if no parent
		if ( elem.parentNode ) {
			return;
		}
		fragment = document.createDocumentFragment();
		fragment.appendChild( elem );
		
		// match elem with all selected elems of parent
		elems = elem.parentNode.querySelectorAll( selector );
		for ( var i=0, len = elems.length; i < len; i++ ) {
			// return true if match
			if ( elems[i] === elem ) {
				return true;
			}
		}
		// otherwise return false
		return false;
	},
	addEvent: function( elem, type, selector, fn ) {
		var eventProxy = fn;
		if (typeof selector === "function") {
			fn = function(event){
				var target = event.target || event.srcElement;
				if (du.matchesSelector(target, selector)) {
					eventProxy.apply(this, arguments);
				}
			};
		}
        if ( elem.addEventListener ) {
            // Standards-based browsers
            elem.addEventListener( type, fn, false );
        } else if ( elem.attachEvent ) {
            // support: IE <9
            elem.attachEvent( "on" + type, fn );
        } else {
            // Caller must ensure support for event listeners is present
            throw new Error( "addEvent() was called in a context without event listener support" );
        }
	},
	removeEvent: function(type, selector, fn){
		//@todo implement (remove return, just there for lint)
		return [type, selector, fn];
	}
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

Doppelganger.Router = function(rootUrl, options) {
this.router = new Sherpa.Router(),
	this.baseUrl = rootUrl;
	this.options = du.extend({}, options);
};
Doppelganger.Router.prototype = {
	recognize: function (fullUrl) {
		return this.router.recognize(fullUrl);
	},
	generate: function (name, params) {
		//because Sherpa mutates params we hand it a copy instead.
		return this.router.generate(name, du.extend({}, params));
	}
};
//iterator is stored here in order to provide safe mutation of filters (add/remove) during process.
var filterIterator = 0;
Doppelganger.FilterManager = function(){
	this.filters = [];
};
Doppelganger.FilterManager.prototype = {
	add: function(filter){
        this.filters.push(filter);
    },
    remove: function(filter){
        var idx = du.indexOf(filter, this.filters);
        if (idx !== false) {
                //If remove is called within a filter, maintain safe iteration.
            if (idx < filterIterator) {
                filterIterator = filterIterator - 1;
            }
            this.filters.splice(idx, 1);
        }
    },
    process: function(filterData){
        for (filterIterator = 0; filterIterator < this.filters.length; filterIterator++) {
            filterData = this.filters[filterIterator](filterData);
        }
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

//@todo figure out what router to use here. Should be a singleton across the application.
var router = new Doppelganger.Router();

//@todo implement routeData
Doppelganger.Filters.RouterFilter = new Filter('Router', function(request, routeData){
	if (!(routeData && routeData.destination && routeData.params)) {
		// On initial load, all routerData will be empty.
		// This is a deep extend in order to combine query and path parameters.
		routeData = du.extend(true, routeData, this.startPage);
	}
	
	if (routeData.destination) {
		routeData = du.extend(routeData, root.helpers.routing.trigger(routeData.destination, routeData.params));
	} else {
		//@todo do filters execute in the context of the application?
		this.navigate.apply(root, root.DEFAULT_ROUTE);
	}
	
	return routeData;
});

function bindEvents(events) {
	var eventData = [];
	if (!events) {
		return eventData;
	}
	du.each(events, function (eventDescriptor, callback) {
		var chunks = eventDescriptor.split(" "),
		eventName = chunks[0].replace(/,/g, ' '),
		selector = chunks.slice(1).join(" "),
		oldCallback = callback;
		
		// We need to treat the callback for URL state change differently.
		if (eventName === "statechange") {
			callback = function() {
				var data = History.getState().data.query;
				oldCallback(data);
			};
			du.addEvent(window, eventName, callback);
		} else {
			du.addEvent(document, eventName, selector, callback);
		}
		
		eventData.push({name: eventName, selector: selector, callback: callback});
	});
	return eventData;
}

function unbindEvents(events) {
	if (events.length === 0) {
		return;
	}
	du.each(events, function (i, eventData) {
		du.removeEvent(eventData.name, eventData.selector, eventData.callback);
	});
}
//@todo implement a way of initlizing data within filter.
//could continue to use closures but I'm concerned about leaking across files.
var previousEvents = [];
//@todo implement routeData
Doppelganger.Filters.EventFilter = new Filter('Event', function(request, routeData){
	if (routeData) {
		if (!routeData.partial) {
			//Use apply to bind to this some `app` context?
			unbindEvents(previousEvents);
		}
		previousEvents = previousEvents.concat(bindEvents(routeData.events));
	}
	return routeData;
});

})(this);