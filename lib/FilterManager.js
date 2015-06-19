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
    /**
     * Add filters to the current application.
     * @param filterArray
     */
	add: function(filterArray){
		this.filters = this.filters.concat(filterArray);
	},
    /**
     * Remove filters from the current application
     * Should be safe to call while processing the filter chain.
     * @param filter
     */
    remove: function(filter){
        var idx = du.indexOf(this.filters, filter);
        if (idx !== false) {
            //If remove is called within a filter, maintain safe iteration.
            if (idx <= filterIterator) {
                filterIterator = filterIterator - 1;
            }
            this.filters.splice(idx, 1);
        }
    },
    /**
     * Loops over all filters currented registered against the application invoking them in the
     * context of the application. Supports both synchronous and asynchronous filters. If a filter
     * returns a thenable, subsequent filters will be enqueued behind it.
     *
     * @param routeData Data to pass to the initial filter.
     * @param filterIterator Where to start in {this.filters} when looping over filters.
     */
    process: function(routeData, customFilterIterator){
		var filterName;
		var newRouteData;
        var that = this;
        filterIterator = customFilterIterator || 0;
        for (; filterIterator < this.filters.length; filterIterator++) {
			filterName = this.filters[filterIterator];
			newRouteData = Doppelganger.getFilterHandler(filterName).call(this.app, routeData);
            if (du.isThenable(newRouteData)) {
                break;
            }
            //If a newRouteData wasn't passed, use the existing routeData
            routeData = newRouteData || routeData;
        }

        //If we haven't finished iterating, enqueue the next call to process.
        if (filterIterator !== this.filters.length && du.isThenable(newRouteData)) {
            newRouteData.then(function(newRouteData){
                //If a newRouteData wasn't passed, use the existing routeData
                routeData = newRouteData || routeData;
                that.process(routeData, filterIterator+1);
            });
        }
    }
};