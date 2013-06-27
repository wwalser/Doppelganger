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

