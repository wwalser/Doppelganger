Doppelganger.Filters.QueryParamFilter = new Filter('QueryParamFilter', function(routeData){	
    if (!(routeData && routeData.params)) {
        // Only need to read query parameters on first load.
        routeData = $.extend(routeData, {params: Arg.all()});
    }
    return routeData;
});
