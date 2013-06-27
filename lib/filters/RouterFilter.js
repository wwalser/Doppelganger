Doppelganger.Filters.RouterFilter = new Filter('Router', function(request){
	function bindRouteEvents(events){
		if (!events) {
			return;
		}
		var doc = $(document);
		du.each(events, function(callback, event){
			var eventName = event.substr(0, event.indexOf(' ')),
			selector = event.substr(eventName.length+1);
			
			doc.on(eventName, selector, callback);
		});
	}
	bindRouteEvents({'click a': function(){
		//faked for grunt build.
		console.log(request);
	}});
});
