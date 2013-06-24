(function(){
	var root = window,
		du = Doppelganger.util;
		$= du.$
		Doppelganger;
	
	root.Doppelganger = Doppelganger = function(){
		this.routes = {};
		this.filters = {};
	};
	Doppelganger.prototype.init = function(){
		//@todo figure out which route to init.
		this.initRoute();
	};
	Doppelganger.prototype.initRoute = function(route){
		bindRouteEvents(route.events);
		//other things to do with initializing a route.
	};

	//add routes and filters.
	function add(name, key, value){
		if (typeof key !== "string") {
			Doppelganger.util.extend({}, this[name], key);
		} else {
			this[name][key] = value;
		}
	}
	Doppelganger.prototype.addRoutes = du.partial(add, 'routes');
	Doppelganger.prototype.addRoute = du.partial(add, 'routes');
	Doppelganger.prototype.addFilter = du.partial(add, 'filters');
	Doppelganger.prototype.addFilter = du.partial(add, 'filters');
	
	function bindRouteEvents(events){
        if (!events) return;
        var doc = $(document);
        du.each(events, function(callback, event){
            var eventName = event.substr(0, event.indexOf(' ')),
                selector = event.substr(eventName.length+1);

            doc.on(eventName, selector, callback);
        });
	}
})();