Doppelganger.Request = Request = function(app){
	this.app = app;
	this.query = Arg.all();
};
Doppelganger.Request.prototype = {
	/**
	 * Sets a single query param key and value
	 */
	setQueryParam: function(key, value){
		if (value.length === 0) {
			delete this.query[key];
		} else {
			this.query[key] = value;
		}
	},
	/**
	 * Returns the query object
	 */
	getQuery: function(){
		return this.query;
	},
	/**
	 * Sets the query object
	 */
	setQuery: function(obj){
		this.query = obj;
	},
	/**
	 * Builds a query string from the query object
	 */
	buildQueryString: function(){
		var queryString = "";
		$.each(this.getQuery(), function(key, value){
			queryString += (encodeURIComponent(key) + "=" + encodeURIComponent(value));
			queryString += '&';
		});
		return queryString.length ? '?' + queryString.slice(0,-1) : queryString;
	}
};
