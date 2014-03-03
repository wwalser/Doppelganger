//***** jQuery adapter *****
//Doppelganger utils and selector
var du,
	$ = root.jQuery;
//useful protos
var arrayProto = Array.prototype;

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
	extend: function(){
		return $.extend.apply($, arguments);
	},
	each: function(obj, iterator) {
		return $.each.call($, obj, iterator);
	},
	isArray: function(value) {
		return $.isArray.call($, value);
	},
	indexOf: function(array, item) {
		return $.inArray.call($, item, array);
	},
	map: function(){
		return $.map.apply($, arguments);
	},
	$: function(selector){
		return $(selector);
	},
	matchesSelector: function(elem, selector) {
		return $(elem).is(selector);
	},
	closest: function(elem, selector) {
		return $(elem).closest(selector);
	},
	addEvent: function( elem, type, selector, fn ) {
		return $(elem).on(type, selector, fn);
	},
	removeEvent: function(elem, type, selector, fn){
		return $(elem).off(type, selector, fn);
	}
};
