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