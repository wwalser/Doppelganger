//***** jQuery adapter *****
//Doppelganger utils and selector
var du,
	$ = root.jQuery;

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
	extend: function(){
		return $.extend.apply($, arguments);
	},
	each: function(obj, iterator, context) {
		return $.each.call($, obj, function(index, value){
			iterator.call(context, value, index);
		});
	},
    isThenable: function(value){
        var isThenable = false;
        if (value && value.then && typeof value.then === "function") {
            isThenable = true;
        }
        return isThenable;
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
