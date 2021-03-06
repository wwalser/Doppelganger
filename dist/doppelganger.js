/***************
 * Doppelganger
 * Copyright Atlassian 2014
 * Released under the Apache 2 license. http://www.apache.org/licenses/LICENSE-2.0.html
 */
(function(root){
	'use strict';
	//main Doppelganger constructor.
	var Doppelganger;
	Doppelganger = function(){
		this.routes = {};
		this.filters = {};
	};
	if ( typeof module === "object" && typeof module.exports === "object" ) {
		module.exports = Doppelganger;
	} else {
		root['Doppelganger'] = Doppelganger;
	}

	//Doppelganger objects
	var FilterManager, RouteManager;

	var document = root.document || {};

//***** Native adapter (default) *****
//Doppelganger utils and selector
var du, $;
//useful protos
var arrayProto = Array.prototype;
//useful functions.
var slice = arrayProto.slice;
//natives
var nativeIsArray = arrayProto.isArray;
var nativeForEach = arrayProto.forEach;
var nativeIndexOf = arrayProto.indexOf;

//Events bound by du.util
var boundEvents = {};

Doppelganger.util = du = {
//Add routes and filters. 
	getterSetterCreator: function (name){
		return function(key, value){
			var obj = this[name];
			if (!value) {
				return obj[key];
			} else {
				obj[key] = value;
			}
		};
	},
	extend: function(obj){
		var iterable = slice.call(arguments, 1),
			source, i, prop;
		for (i = 0; i < iterable.length; i++) {
			source = iterable[i];
			if (source) {
				for (prop in source) {
					if (source.hasOwnProperty(prop)) {
						obj[prop] = source[prop];
					}
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
    isThenable: function(value){
        var isThenable = false;
        if (value && value.then && typeof value.then === "function") {
            isThenable = true;
        }
        return isThenable;
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
		if (elem.matches) {
			return elem.matches(selector);
		}
		// append to fragment if no parent
		if ( !elem.parentNode ) {
			if (elem === document) {
				return selector === 'document';
			}
			fragment = document.createDocumentFragment();
			fragment.appendChild( elem );
		}
		
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
	closest: function(elem, selector) {
		var current = elem,
			found = false;
		while (current != null) {
			found = du.matchesSelector(current, selector);
			if (found) {
				break;
			}
			current = current.parentNode;
		}
		return found;
	},
	addEvent: function( elem, type, selector, fn ) {
		var eventProxy = fn;
		if (fn) {
			fn = function(event){
				var target = event.target || event.srcElement;
				if (du.closest(target, selector)) {
					eventProxy.apply(this, arguments);
				}
			};
		} else {
			fn = selector;
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
		if (!boundEvents[type]) {
			boundEvents[type] = [];
		}
		boundEvents[type].push({
			fn: eventProxy,
			boundFn: fn,
			selector: typeof selector === 'string' ? selector : ''
		});
	},
	removeEvent: function(elem, type, selector, fn){
		var potentialEvents = boundEvents[type],
			length = potentialEvents ? potentialEvents.length : 0,
			i = 0,
			currentEvent, boundFn;

		for (; i < length; i++) {
			currentEvent = potentialEvents[i];
			if (fn === currentEvent.fn && selector === currentEvent.selector) {
				boundFn = currentEvent.boundFn;
				potentialEvents.splice(i, 1);
				break;
			}
		}

		if (boundFn) {
			if (elem.removeEventListener) {
				// Standards-based browsers
				elem.removeEventListener(type, boundFn);
			} else if (elem.detachEvent) {
				// support: IE <9
				elem.detachEvent(type, boundFn);
			} else {
				throw new Error( "removeEvent() was called in a context without event listener support" );
			}
		}
	}
};
$ = du.$;


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
		this.startPage = this.routeManager.recognize(window.location.pathname + window.location.search);
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

Doppelganger.RouteManager = RouteManager = function(app, rootUrl) {
	this.app = app;
	this.router = new Sherpa.Router(),
	this.baseUrl = rootUrl;
	this.routes = [];
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
		this.routes = this.routes.concat(routeArray);
	},
	recognize: function (fullUrl) {
		var queryIndex = fullUrl.indexOf('?'),
		urlWithoutQuery = fullUrl,
		queryParams, routeObject;
		if (queryIndex !== -1) {
			urlWithoutQuery = fullUrl.substring(0, queryIndex);
			queryParams = Arg.parse(fullUrl);
		}
		routeObject = this.router.recognize(urlWithoutQuery);
		//If the route was found, clean it up and add query params to the params list.
		if (routeObject) {
			routeObject = du.extend({}, routeObject);
			routeObject.params = du.extend(routeObject.params, queryParams);
		}
		return routeObject;
	},
	generate: function (name, params) {
		//because Sherpa mutates params we hand it a copy instead.
		return this.router.generate(name, du.extend({}, params));
	},
	trigger: function(destination, routeData) {
		return Doppelganger.getRouteHandler(destination).call(this.app, routeData);
	}
};
//iterator is stored here in order to provide safe mutation of filters (add/remove) during process.
var filterIterator = 0;
Doppelganger.FilterManager = FilterManager = function(app){
	this.filters = [];
	this.app = app;
};
Doppelganger.FilterManager.prototype = {
    /**
     * Add filters to the current application.
     * @param filterArray
     */
	add: function(filterArray){
		this.filters = this.filters.concat(filterArray);
	},
    /**
     * Remove filters from the current application
     * Should be safe to call while processing the filter chain.
     * @param filter
     */
    remove: function(filter){
        var idx = du.indexOf(this.filters, filter);
        if (idx !== false) {
            //If remove is called within a filter, maintain safe iteration.
            if (idx <= filterIterator) {
                filterIterator = filterIterator - 1;
            }
            this.filters.splice(idx, 1);
        }
    },
    /**
     * Loops over all filters currented registered against the application invoking them in the
     * context of the application. Supports both synchronous and asynchronous filters. If a filter
     * returns a thenable, subsequent filters will be enqueued behind it.
     *
     * @param routeData Data to pass to the initial filter.
     * @param filterIterator Where to start in {this.filters} when looping over filters.
     */
    process: function(routeData, customFilterIterator){
		var filterName;
		var newRouteData;
        var that = this;
        filterIterator = customFilterIterator || 0;
        for (; filterIterator < this.filters.length; filterIterator++) {
			filterName = this.filters[filterIterator];
			newRouteData = Doppelganger.getFilterHandler(filterName).call(this.app, routeData);
            if (du.isThenable(newRouteData)) {
                break;
            }
            //If a newRouteData wasn't passed, use the existing routeData
            routeData = newRouteData || routeData;
        }

        //If we haven't finished iterating, enqueue the next call to process.
        if (filterIterator !== this.filters.length && du.isThenable(newRouteData)) {
            newRouteData.then(function(newRouteData){
                //If a newRouteData wasn't passed, use the existing routeData
                routeData = newRouteData || routeData;
                that.process(routeData, filterIterator+1);
            });
        }
    }
};
//@todo implement routeData
Doppelganger.setFilterHandler('RouterFilter', function(routeData){
	if (!(routeData.destination && routeData.params)) {
		// On initial load, all routerData will be empty.
		// This is a deep extend in order to combine query and path parameters.
		//@todo what was this for?
		//routeData = du.extend(true, routeData, this.startPage);
	}
	
	if (routeData.destination) {
		routeData = du.extend(routeData, this.routeManager.trigger(routeData.destination, routeData));
	}
	
	return routeData;
});

function bindEvents(events) {
	var eventData = [];
	if (!events) {
		return eventData;
	}
	du.each(events, function (callback, eventDescriptor) {
		var chunks = eventDescriptor.split(" "),
			eventNames = chunks[0].split(','),
			selector = chunks.slice(1).join(" "),
			oldCallback = callback,
			elem;
		
		// We need to treat the callback for URL state change differently.
		du.each(eventNames, function(eventName){
			if (eventName === "statechange") {
				elem = window;
				callback = function() {
					var data = History.getState().data.query;
					oldCallback(data);
				};
				du.addEvent(elem, eventName, callback);
			} else {
				elem = document;
				du.addEvent(elem, eventName, selector, callback);
			}
			
			eventData.push({name: eventName, selector: selector, callback: callback, elem: elem});
		});
	});
	return eventData;
}

function unbindEvents(events) {
	if (events.length === 0) {
		return;
	}
	du.each(events, function (eventData) {
		du.removeEvent(eventData.elem, eventData.name, eventData.selector, eventData.callback);
	});
}
//@todo implement a way of initlizing data within filter.
//could continue to use closures but I'm concerned about leaking across files.
var previousEvents = [];
//@todo implement routeData
Doppelganger.setFilterHandler('EventFilter', function(routeData){
	if (!routeData.partial) {
		//Use apply to bind to this some `app` context?
		unbindEvents(previousEvents);
	}
	previousEvents = previousEvents.concat(bindEvents(routeData.events));
	return routeData;
});

})(this);