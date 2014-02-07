var boundEvents = {};
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
		if (elem.matches) {
			return elem.matches(selector);
		}
		// append to fragment if no parent
		if ( !elem.parentNode ) {
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
	addEvent: function( elem, type, selector, fn ) {
		var eventProxy = fn;
		if (fn) {
			fn = function(event){
				var target = event.target || event.srcElement;
				if (du.matchesSelector(target, selector)) {
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
			selector: typeof selector === 'string' ? selector : '',
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

