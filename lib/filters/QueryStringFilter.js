/**
 * Parases a query string into a query object
 */
Doppelganger.Filters.QueryStringFilter = new Filter('QueryString', function(request){
	if (!(routeData && routeData.params)) {
		// Only need to read query parameters on first load.
		routeData = $.extend(routeData, {params: Arg.all()});
	}
	//@todo figure out request object
	request.setQuery(query);
	return routeData;
});
