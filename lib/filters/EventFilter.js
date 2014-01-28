function bindEvents(events) {
	var eventData = [];
	if (!events) {
		return eventData;
	}
	du.each(events, function (eventDescriptor, callback) {
		var chunks = eventDescriptor.split(" "),
		eventName = chunks[0].replace(/,/g, ' '),
		selector = chunks.slice(1).join(" "),
		oldCallback = callback;
		
		// We need to treat the callback for URL state change differently.
		if (eventName === "statechange") {
			callback = function() {
				var data = History.getState().data.query;
				oldCallback(data);
			};
			du.addEvent(window, eventName, callback);
		} else {
			du.addEvent(document, eventName, selector, callback);
		}
		
		eventData.push({name: eventName, selector: selector, callback: callback});
	});
	return eventData;
}

function unbindEvents(events) {
	if (events.length === 0) {
		return;
	}
	du.each(events, function (i, eventData) {
		du.removeEvent(eventData.name, eventData.selector, eventData.callback);
	});
}
//@todo implement a way of initlizing data within filter.
//could continue to use closures but I'm concerned about leaking across files.
var previousEvents = [];
//@todo implement routeData
Doppelganger.Filters.EventFilter = new Filter('Event', function(routeData){
	if (!routeData.partial) {
		//Use apply to bind to this some `app` context?
		unbindEvents(previousEvents);
	}
	previousEvents = previousEvents.concat(bindEvents(routeData.events));
	return routeData;
});
