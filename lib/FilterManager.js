/**
 * Filter chain used by app.js to process requests.
 */
//iterator is stored here in order to provide safe mutation of filters (add/remove) during process.
var filterIterator = 0;
Doppelganger.FilterManager = function(){
	this.filters = [];
};
Doppelganger.FilterManager.prototype = {
	add: function(filter){
        this.filters.push(filter);
    },
    remove: function(filter){
        var idx = du.indexOf(filter, this.filters);
        if (idx !== false) {
                //If remove is called within a filter, maintain safe iteration.
            if (idx < filterIterator) {
                filterIterator = filterIterator - 1;
            }
            this.filters.splice(idx, 1);
        }
    },
    process: function(filterData){
        for (filterIterator = 0; filterIterator < this.filters.length; filterIterator++) {
            filterData = this.filters[filterIterator](filterData);
        }
    }
};