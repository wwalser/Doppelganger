Doppelganger.Filters.LocationFilter = new Filter('Location', function(request){
	var location;
	request.location = location = root.location;
	//In case we're using Doppelganger in an environment without a global variable
	if (location) {
		request.search = root.location.search;
		request.pathName = root.location.pathname;
	}
});
