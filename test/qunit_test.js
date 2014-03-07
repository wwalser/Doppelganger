var Doppelganger = window.Doppelganger;
module('Basics');
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

	var mouseEvent = document.createEvent("MouseEvents");
	//Mozilla requires all parameters to initMouseEvent
    mouseEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
	document.getElementById('qunit').dispatchEvent(mouseEvent);
});

module('FilterManager');

test('Add an array of filters.', function(){
	expect(1);
	var filterManager = new Doppelganger.FilterManager({});
	try {
		filterManager.add(['test', 'foo', 'bar']);
		ok('Adding an array of filters works correctly.');
	} catch (e) {
		ok(false, 'Adding an array of filters works properly.');
	}
});

test('Multiple calls to add.', function(){
	expect(1);
	var filterSet1 = ['test', 'foo', 'bar'];
	var filterSet2 = ['baz', 'qux'];
	var filterManager = new Doppelganger.FilterManager({});
	filterManager.add(filterSet1);
	filterManager.add(filterSet2);
	deepEqual(filterManager.filters, filterSet1.concat(filterSet2), 'Multiple filter sets can be added');
});

test('Multiple calls to add.', function(){
	expect(1);
	var filterSet1 = ['test', 'foo', 'bar'];
	var filterManager = new Doppelganger.FilterManager({});
	filterManager.add(filterSet1);
	filterManager.remove('foo');
	deepEqual(filterManager.filters, ['test', 'bar'], 'Multiple filter sets can be added');
});

module('RouteManager', {
	setup: function(){
		var pathWithoutFilename;
		this.pathname = window.location.pathname;
		pathWithoutFilename = this.pathname.substr(0, this.pathname.lastIndexOf("/"));
		this.fileName = this.pathname.substr(this.pathname.lastIndexOf("/"));
		this.folder = pathWithoutFilename;
		this.testPath = '/foobar';
	}
});

test('Add an array of route objects', function(){
	expect(1);
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	var routeManager = new Doppelganger.RouteManager({}, this.folder);
	try {
		routeManager.add(routes);
		ok('Add works');
	} catch (e) {
		ok(false, 'Add should just work.');
	}
});

test('Add can be called multiple times', function(){
	expect(1);
	var routeManager = new Doppelganger.RouteManager({}, this.folder);
	try {
		routeManager.add([{name: 'route1', url: this.fileName}]);
		routeManager.add([{name: 'route2', url: this.testPath}]);
		ok('Add works');
	} catch (e) {
		ok(false, 'Add should just work.');
	}
});

test('recognize', function(){
	expect(1);
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	var routeManager = new Doppelganger.RouteManager({}, this.folder);
	routeManager.add(routes);
	equal(routeManager.recognize(this.folder + this.testPath)['destination'], 'route2', 'Route was recognized.');
});

test('generate', function(){
	expect(2);
	var expectedPath1 = this.pathname;
	var expectedPath2 = this.folder + this.testPath;
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	var routeManager = new Doppelganger.RouteManager({}, this.folder);
	routeManager.add(routes);
	equal(routeManager.generate('route1'), expectedPath1, 'route1 generated correctly');
	equal(routeManager.generate('route2'), expectedPath2, 'route2 generated correctly.');
});

test('generate with query params', function(){
	expect(2);
	var expectedPath1 = this.pathname + '?foo=bar';
	var expectedPath2 = this.folder + this.testPath + '?foo=bar';
	var generateParameters = {foo: 'bar'};
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	var routeManager = new Doppelganger.RouteManager({}, this.folder);
	routeManager.add(routes);
	equal(routeManager.generate('route1', generateParameters), expectedPath1, 'route1 generated correctly');
	equal(routeManager.generate('route2', generateParameters), expectedPath2, 'route2 generated correctly.');
});

module('Filter integration tests');

test('Filters run in order they are registered', function(){
	expect(2);
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	var count = 0;
	function filterHandlerCreator(expectedCount){
		return function(){
			count++;
			equal(count, expectedCount, 'Filter ' + count + ' ran in correct order.');
		};
	}
	var filters = ['first', 'second'];
	Doppelganger.setFilterHandler('first', filterHandlerCreator(1));
	Doppelganger.setFilterHandler('second', filterHandlerCreator(2));
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: filters
	});
	app.init();
});

test('Filter can be added after app is created', function(){
	expect(4);
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	var count = 0;
	function filterHandlerCreator(expectedCount){
		return function(){
			count++;
			equal(count, expectedCount, 'Filter ' + count + ' ran in correct order.');
		};
	}
	Doppelganger.setFilterHandler('first', filterHandlerCreator(1));
	Doppelganger.setFilterHandler('second', filterHandlerCreator(2));
	
	var app1 = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: []
	});
	app1.filterManager.add(['first', 'second']);
	app1.init();

	//reset count
	count = 0;
	var app2 = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: ['first']
	});
	app2.filterManager.add(['second']);
	app2.init();
});

test('Filter can be removed prior to init', function(){
	expect(1);
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	var filters = ['first', 'second'];
	Doppelganger.setFilterHandler('first', function(){
		ok('First filter successfully called');
	});
	Doppelganger.setFilterHandler('second', function(){
		ok(false, 'Second filter should have been removed before init.');
	});
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: filters
	});
	app.filterManager.remove('second');
	app.init();
});

test('Filter can be removed during filter chain', function(){
	expect(1);
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	var filters = ['first', 'second'];
	Doppelganger.setFilterHandler('first', function(){
		//remove second filter prior to iterating to it.
		app.filterManager.remove('second');
		ok('First filter successfully called');
	});
	Doppelganger.setFilterHandler('second', function(){
		ok(false, 'Second filter should have been removed by "first" filter.');
	});
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: filters
	});
	app.init();
});

test('Filter can remove itself.', function(){
	expect(3);
	var routes = [
		{name: 'route1', url: window.location.pathname}
	];
	var filters = ['unlimited', 'onlyOnce'];
	Doppelganger.setFilterHandler('unlimited', function(){
		ok('First filter successfully called');
	});
	var firstRun = true;
	Doppelganger.setFilterHandler('onlyOnce', function(){
		if (firstRun) {
			//remove second filter prior to iterating to it.
			app.filterManager.remove('second');
			ok('This filter can run only once.');
		} else {
			ok(false, 'A second run of this filter is not allowed.');
		}
	});
	
	var app = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: filters
	});
	app.init();
	app.trigger('route1', {});
});

module('router integration tests', {
	setup: function(){
		var pathWithoutFilename;
		this.pathname = window.location.pathname;
		pathWithoutFilename = this.pathname.substr(0, this.pathname.lastIndexOf("/"));
		this.fileName = this.pathname.substr(this.pathname.lastIndexOf("/"));
		this.folder = pathWithoutFilename;
		this.testPath = '/foobar';
	}
});

test('startPage lookup works as expected', function(){
	expect(1);
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	Doppelganger.setRouteHandler('route1', function(){
		ok('Things work');
	});
	var app = Doppelganger.create({
		rootUrl: this.folder,
		routes: routes
	});
	app.init();
});