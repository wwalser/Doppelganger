function bindEvents(events) {
	var eventData = [];
	if (!events) {
		return eventData;
	}
	du.each(events, function (callback, eventDescriptor) {
		var chunks = eventDescriptor.split(" "),
			eventName = chunks[0].replace(/,/g, ' '),
			selector = chunks.slice(1).join(" "),
			oldCallback = callback,
			elem;
		
		// We need to treat the callback for URL state change differently.
		if (eventName === "statechange") {
			elem = window;
			callback = function() {
				var data = History.getState().data.query;
				oldCallback(data);
			};
			du.addEvent(elem, eventName, callback);
		} else {
			elem = document;
			du.addEvent(elem, eventName, selector, callback);
		}
		
		eventData.push({name: eventName, selector: selector, callback: callback, elem: elem});
		
	});
	return eventData;
}

function unbindEvents(events) {
	if (events.length === 0) {
		return;
	}
	du.each(events, function (eventData) {
		du.removeEvent(eventData.elem, eventData.name, eventData.selector, eventData.callback);
	});
}
//@todo implement a way of initlizing data within filter.
//could continue to use closures but I'm concerned about leaking across files.
var previousEvents = [];
//@todo implement routeData
Doppelganger.setFilterHandler('EventFilter', function(routeData){
	if (!routeData.partial) {
		//Use apply to bind to this some `app` context?
		unbindEvents(previousEvents);
	}
	previousEvents = previousEvents.concat(bindEvents(routeData.events));
	return routeData;
});
