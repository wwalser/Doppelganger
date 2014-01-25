//@todo implement routeData
Doppelganger.Filters.RouterFilter = new Filter('Router', function(request){
	if (!(request.destination && request.params)) {
		// On initial load, all routerData will be empty.
		// This is a deep extend in order to combine query and path parameters.
		//@todo what was this for?
		//request = du.extend(true, routeData, this.startPage);
	}
	
	if (request.destination) {
		//@todo trigger route
		//router = du.extend(router, root.helpers.routing.trigger(routeData.destination, routeData.params));
	} else {
		//@todo do filters execute in the context of the application?
		this.navigate.apply(root, root.DEFAULT_ROUTE);
	}
	
	return request;
});
