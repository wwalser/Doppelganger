/**
 * Filter chain used by app.js to process requests.
 */
//iterator is stored here in order to provide safe mutation of filters (add/remove) during process.
var filterIterator = 0;
Doppelganger.FilterManager = FilterManager = function(app){
	this.filters = [];
	this.app = app;
};
Doppelganger.FilterManager.prototype = {
	add: function(filterArray){
		this.filters = this.filters.concat(filterArray);
	},
    remove: function(filter){
        var idx = du.indexOf(this.filters, filter);
        if (idx !== false) {
            //If remove is called within a filter, maintain safe iteration.
            if (idx < filterIterator) {
                filterIterator = filterIterator - 1;
            }
            this.filters.splice(idx, 1);
        }
    },
    process: function(routeData){
		var filterName;
		var newRouteData;
        for (filterIterator = 0; filterIterator < this.filters.length; filterIterator++) {
			filterName = this.filters[filterIterator];
			newRouteData = Doppelganger.getFilterHandler(filterName).call(this.app, routeData);
			//Protect the filter chain data from filters which forget to return routeData object.
			if (newRouteData) {
				routeData = newRouteData;
			}
        }
    }
};