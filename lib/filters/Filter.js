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