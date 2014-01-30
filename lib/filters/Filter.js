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