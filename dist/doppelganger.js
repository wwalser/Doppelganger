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


var boundEvents = {};
Doppelganger.util = du = {
//Add routes and filters. 
	getterSetterCreator: function (name){
		return function(key, value){
			var obj = this[name];
			if (typeof key !== "string") {
				if (du.isArray(obj)) {
					if (du.isArray(key)) {
						arrayProto.push.apply(obj, key);
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
	routes: {'index': ''},
	filters: ['EventFilter', 'RouterFilter']
};
var defaultAppObjectFields = {'routes': 'routeManager', 'filters': 'filterManager'};

/**
 * Create a new Doppelganger application.
 */
Doppelganger.create = function(appObj){
	var app = new Doppelganger();
	var field, propertyValue;
	app.options = du.extend({}, defaults, appObj.options);
	app.filterManager = new Doppelganger.FilterManager(app);
	app.routeManager = new Doppelganger.RouteManager(app, appObj.rootUrl);
	//Setup routes and filters that this application will use
	for (var property in defaultAppObjectFields) {
		if (defaultAppObjectFields.hasOwnProperty(property)){
			//respective handler for this property type [ex: 'filterManager']
			field = defaultAppObjectFields[property];
			//if the value isn't provided, fallback to defaults [ex: defaults.filters]
			propertyValue = appObj[property] || app.options[property];
			//call the add method on respective handler [ex: app.filterManager.add(defaults.filters)]
			app[field]['add'](propertyValue);
		}
	}
	return app;
};

Doppelganger.prototype = {
	init: function(){
		var self = this;
		//do fancy things.
		History.Adapter.bind(window,'statechange', function(){
			var state = History.getState();
			//Fire filter chain.
			if (state.data.destination && !state.data.controllerStateChange) {
				//if controllerStateChange is true a controller has triggered this state change.
				//Otherwise use filter chain.
				self.trigger(state.data.destination, state.data.params);
			} else if (!state.data.destination) {
				self.trigger(self.startPage.destination, self.startPage.params);
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
			this.startPage = du.extend({}, this.startPage);
			this.startPage.params = du.extend(this.startPage.params, Arg.all());
			this.trigger(this.startPage.destination, this.startPage.params);
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
		this.set(routeArray);
	},
	set: du.getterSetterCreator('routes'),
	get: du.getterSetterCreator('routes'),
	recognize: function (fullUrl) {
		return this.router.recognize(fullUrl);
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
			routeData = Doppelganger.getFilterHandler(filterName).call(this.app, routeData);
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