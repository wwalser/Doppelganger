/**
 * Parases a query string into a query object
 */
Doppelganger.Filters.QueryStringFilter = new Filter('QueryString', function(request){
	var search = request.search,
		splitSearch = search.slice(1).split('&'),
		query = {};
	
	if (search !== "") {
		$.each(splitSearch, function(i, paramString){
			var paramPair = paramString.split('=');
			query[paramPair[0]] = paramPair[1];
		});
	}
	request.setQuery(query);
});
