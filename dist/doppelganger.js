(function(root){
	'use strict';
	//main Doppelganger constructor.
	var Doppelganger;

	//Doppelganger objects
	var Filter, FilterManager, Route, RouteManager;

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
	var Sherpa = root.Sherpa || {Router: function(){}};
	var Arg = root.Arg || {all: function(){}};
Doppelganger = function(){
	this.routes = {};
	this.filters = {};
};
if ( typeof module === "object" && typeof module.exports === "object" ) {
	module.exports = Doppelganger;
} else {
	root['Doppelganger'] = Doppelganger;
}

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
		this.startPage = this.routeManager.recognize(window.location.pathname);
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


Doppelganger.util = du = {
//Add routes and filters. 
	getterSetterCreator: function (name){
		return function(key, value){
			var obj = this[name];
			if (typeof key !== "string") {
				if (du.isArray(obj)) {
					if (du.isArray(key)) {
						obj.concat(key);
					} else {
						obj.push(key);
					}
				} else {
					du.extend(obj, key);
				}
			} else if (!value) {
				return obj[key];
			} else {
				obj[key] = value;
			}
		};
	},
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
	$: function(selector){
		return document.querySelectorAll(selector);
	},
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


Doppelganger.RouteManager = RouteManager = function(app, rootUrl) {
	this.app = app;
	this.router = new Sherpa.Router(),
	this.baseUrl = rootUrl;
	this.routes = {};
};
Doppelganger.RouteManager.prototype = {
	add: function(routeArray){
		var length = routeArray.length,
			i = 0,
			routeObject, name, url;
		
		for (; i < length; i++) {
			routeObject = routeArray[i];
			name = routeObject.name;
			url = routeObject.url;
			//have to use .to and .name because Sherpa is annoying like that
			//consider switching to a different router at some point
			this.router.add(this.baseUrl + url, routeObject).to(name).name(name);
		}
		du.extend(this.router, routeObject);
	},
	get: du.getterSetterCreator('routes'),
	recognize: function (fullUrl) {
		return this.router.recognize(fullUrl);
	},
	generate: function (name, params) {
		//because Sherpa mutates params we hand it a copy instead.
		return this.router.generate(name, du.extend({}, params));
	},
	trigger: function(destination, params) {
		return Doppelganger.Routes[destination].invoke(this.app, params);
	}
};
//Namespace for all of Doppelganger's built in Routers.
Doppelganger.Routes = {};
//Constructor for a routers.
Doppelganger.Route = Route = function(name, route){
	this.name = name;
	this.route = route;
	Doppelganger.Routes[name] = this;
};

Route.prototype = {
	invoke: function(app, routeData){
		this.route.call(app, routeData);
	}
};
//iterator is stored here in order to provide safe mutation of filters (add/remove) during process.
var filterIterator = 0;
Doppelganger.FilterManager = FilterManager = function(app){
	this.filters = [];
	this.app = app;
};
Doppelganger.FilterManager.prototype = {
	add: du.getterSetterCreator('filters'),
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
    process: function(routeData){
        for (filterIterator = 0; filterIterator < this.filters.length; filterIterator++) {
			var filterName = this.filters[filterIterator];
			routeData = Doppelganger.Filters[filterName].invoke(this.app, routeData);
        }
    }
};
//Namespace for all of Doppelganger's built in Filters.
Doppelganger.Filters = {};
//Constructor for a filters.
Doppelganger.Filter = Filter = function(name, filter){
	this.name = name;
	this.filter = filter;
	Doppelganger.Filters[name] = filter;
};

Filter.prototype = {
	invoke: function(app, routeData){
		return this.filter.call(app, routeData);
	}
};
//@todo implement routeData
Doppelganger.Filters.RouterFilter = new Filter('RouterFilter', function(routeData){
	if (!(routeData.destination && routeData.params)) {
		// On initial load, all routerData will be empty.
		// This is a deep extend in order to combine query and path parameters.
		//@todo what was this for?
		//routeData = du.extend(true, routeData, this.startPage);
	}
	
	if (routeData.destination) {
		routeData = du.extend(routeData, this.routeManager.trigger(routeData.destination, routeData.params));
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
Doppelganger.Filters.EventFilter = new Filter('EventFilter', function(routeData){
	if (!routeData.partial) {
		//Use apply to bind to this some `app` context?
		unbindEvents(previousEvents);
	}
	previousEvents = previousEvents.concat(bindEvents(routeData.events));
	return routeData;
});

Doppelganger.Filters.QueryParamFilter = new Filter('QueryParamFilter', function(routeData){	
    if (!(routeData && routeData.params)) {
        // Only need to read query parameters on first load.
        routeData = $.extend(routeData, {params: Arg.all()});
    }
    return routeData;
});

})(this);