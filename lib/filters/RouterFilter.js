//@todo figure out what router to use here. Should be a singleton across the application.
var router = new Doppelganger.Router();

//@todo implement routeData
Doppelganger.Filters.RouterFilter = new Filter('Router', function(request, routeData){
    if (!(routeData && routeData.destination && routeData.params)) {
        // On initial load, all routerData will be empty.
        // This is a deep extend in order to combine query and path parameters.
        routeData = du.extend(true, routeData, this.startPage);
    }
	
    if (routeData.destination) {
        routeData = du.extend(routeData, root.helpers.routing.trigger(routeData.destination, routeData.params));
    } else {
		//@todo do filters execute in the context of the application?
        this.navigate.apply(root, root.DEFAULT_ROUTE);
    }
	
    return routeData;
});
