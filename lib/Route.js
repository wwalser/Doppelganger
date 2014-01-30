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