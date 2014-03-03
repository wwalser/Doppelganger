var Doppelganger = window.Doppelganger;
test('Basic app setup', function() {
	expect(2);
	
	//routes are objects
	var routes = [
		{name: 'route1', url: "route1"},
		{name: 'route2', url: "route2"}
	];
	var filters = [
		'bar','baz'
	];
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: filters
	});
	
	equal(app.routeManager.routes[0], routes[0], 'route should be returned when directly accessed.');
	equal(app.filterManager.filters[1], filters[1], 'filter2 should be returned.');
});

test('Basic filter setup', function() {
	expect(1);
	
	//routes are objects
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	var filters = [
		'bar'
	];
	Doppelganger.setFilterHandler('bar', function() {
		ok('filter successfully setup');
	});
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: filters
	});
	app.init();
});

test('Basic route setup', function() {
	expect(1);
	
	//routes are objects
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	Doppelganger.setRouteHandler('route1', function(){
		ok('route successfully setup');
	});
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes
	});
	app.init();
});

asyncTest('Basic event setup', function(){
	expect(1);
	
	//routes are objects
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	Doppelganger.setRouteHandler('route1', function(){
		return {
			events: {
				'click #qunit': function(){
					ok('event successfully bound');
					start();
				}
			}
		};
	});
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes
	});
	app.init();

	var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true);
	document.getElementById('qunit').dispatchEvent(evt);
});