//@todo implement routeData
(new Filter('RouterFilter', function(routeData){
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
}));
