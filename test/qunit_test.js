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
	app._destroy();
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
	app._destroy();
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
	app._destroy();
});

(function(){
function setResetCoerceMode() {
	window.Arg.coerceMode = true;
}
module('Options', {
	//set and reset coerceMode so that it doesn't affect other tests
	setup: setResetCoerceMode,
	teardown: setResetCoerceMode
});
})();

test('urlCoerceMode', function(){
	expect(1);
	Doppelganger.create({
		rootUrl: '',
		routes: [],
		urlCoerceMode: false
	});
	equal(window.Arg.coerceMode, false, 'Arg.coerceMode should be set to false by Doppelganger.');
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

test('Filters can be removed.', function(){
	expect(1);
	var filterSet1 = ['test', 'foo', 'bar'];
	var filterManager = new Doppelganger.FilterManager({});
	filterManager.add(filterSet1);
	filterManager.remove('foo');
	deepEqual(filterManager.filters, ['test', 'bar'], 'Remove call should remove filter from the filterManager.');
});

test("Filters which don't return routeData object.", function(){
	var filterSet = ['testNoRouteDataReturn', 'testsRouteDataIsPresent'];
	var filterManager = new Doppelganger.FilterManager({});
	var testRouteData = {testing: 'success'};
	Doppelganger.setFilterHandler('testNoRouteDataReturn', function(){});
	Doppelganger.setFilterHandler('testsRouteDataIsPresent', function(routeData){
		equal(routeData, testRouteData, 'Route data should survive bad filters.');
	});
	filterManager.add(filterSet);
	filterManager.process(testRouteData);
});

asyncTest("Filters chain waits on async filter.", 1, function(){
    var filterSet = ['testThenableFilter', 'testWasNotCalledImmediately'];
    var filterManager = new Doppelganger.FilterManager({});
    var testRouteData = {testing: 'success'};
    var changesEventuallyFlag = false;
    Doppelganger.setFilterHandler('testThenableFilter', function(routeData){
        return {
            then: function(funcToEnqueue){
                setTimeout(function(){
                    funcToEnqueue(routeData);
                }, 10);
                changesEventuallyFlag = true;
            }
        };
    });
    Doppelganger.setFilterHandler('testWasNotCalledImmediately', function(){
        start();
        ok(changesEventuallyFlag, 'The filter should be called asynchronously instead of immediately.');
    });
    filterManager.add(filterSet);
    filterManager.process(testRouteData);
});

test("RouteData survives bad async filter.", 1, function(){
    var filterSet = ['testThenableFilterWithNoRouteDataPassed', 'testsRouteDataIsPresent'];
    var filterManager = new Doppelganger.FilterManager({});
    var testRouteData = {testing: 'success'};
    Doppelganger.setFilterHandler('testThenableFilterWithNoRouteDataPassed', function(){
        return {
            then: function(funcToEnqueue){
                //no route data passed to enqueued filter.
                funcToEnqueue();
            }
        };
    });
    Doppelganger.setFilterHandler('testsRouteDataIsPresent', function(routeData){
        equal(routeData, testRouteData, 'Route data should survive bad filters.');
    });
    filterManager.add(filterSet);
    filterManager.process(testRouteData);
});

test("Correct RouteData is used after async filter.", 1, function(){
    var filterSet = ['testThenableFilterWithNoRouteDataPassed', 'testsRouteDataIsPresent'];
    var filterManager = new Doppelganger.FilterManager({});
    var testRouteData = {testing: 'success'};
    var newRouteData = {awesome: 'true'};
    Doppelganger.setFilterHandler('testThenableFilterWithNoRouteDataPassed', function(){
        return {
            then: function(funcToEnqueue){
                //ignores the routeData passed to it, returns awesome route data instead
                funcToEnqueue(newRouteData);
            }
        };
    });
    Doppelganger.setFilterHandler('testsRouteDataIsPresent', function(routeData){
        //ensure next filter recieves awesome route data.
        equal(routeData, newRouteData, 'Route data should survive bad filters.');
    });
    filterManager.add(filterSet);
    filterManager.process(testRouteData);
});

module('RouteManager', {
	setup: function(){
		var pathWithoutFilename;
		this.pathname = window.location.pathname;
		pathWithoutFilename = this.pathname.substr(0, this.pathname.lastIndexOf("/"));
		this.fileName = this.pathname.substr(this.pathname.lastIndexOf("/"));
		this.folder = pathWithoutFilename;
		this.testPath = '/foobar';
		this.queryString = '?test=true';
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

test('recognize without query params', function(){
	expect(1);
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	var routeManager = new Doppelganger.RouteManager({}, this.folder);
	routeManager.add(routes);
	equal(routeManager.recognize(this.folder + this.testPath)['destination'], 'route2', 'Route was recognized.');
});

test('recognize without query params', function(){
	expect(2);
	var routeObject;
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	var routeManager = new Doppelganger.RouteManager({}, this.folder);
	routeManager.add(routes);
	routeObject = routeManager.recognize(this.folder + this.testPath + this.queryString);
	equal(routeObject['destination'], 'route2', 'Route was recognized.');
	equal(routeObject['params']['test'], true, 'Query params were turned into routeObject params.');
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
	app._destroy();
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
	app1._destroy();

	//reset count
	count = 0;
	var app2 = Doppelganger.create({
		rootUrl: '',
		routes: routes,
		filters: ['first']
	});
	app2.filterManager.add(['second']);
	app2.init();
	app2._destroy();
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
	app._destroy();
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
	app._destroy();
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
	app._destroy();
});

module('router integration tests', {
	setup: function(){
		var pathWithoutFilename;
		this.pathname = window.location.pathname;
		pathWithoutFilename = this.pathname.substr(0, this.pathname.lastIndexOf("/"));
		this.fileName = this.pathname.substr(this.pathname.lastIndexOf("/"));
		this.folder = pathWithoutFilename;
		this.testPath = '/foobar';

		this.resetUrl = window.location.toString();
	},
	teardown: function(){
		History.pushState({}, document.title, this.resetUrl);
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
	app._destroy();
});

test('Default route redirect', function(){
	expect(2);
	var test = this;
	var routes = [
		{name: 'route1', url: this.fileName + 'incorrect'},
		{name: 'route2', url: this.testPath}
	];
	var oldReplaceState = History.replaceState;
	History.replaceState = function(stateObject, title, location){
		equal(location, test.folder + test.testPath + '?foo=bar', 'Default route used correctly');
		deepEqual(stateObject, {destination: 'route2', params: {foo:'bar'}});
		History.replaceState = oldReplaceState;
	};
	var app = Doppelganger.create({
		defaultRoute: ['route2', {'foo': 'bar'}],
		rootUrl: this.folder,
		routes: routes
	});
	app.init();
	app._destroy();
});

test('Query params passed to route handler', function(){
	if (window.navigator.userAgent.match(/PhantomJS/)) {
		ok(true);
		return;
	}
	expect(2);
	var routes = [
		{name: 'route1', url: this.fileName},
		{name: 'route2', url: this.testPath}
	];
	Doppelganger.setRouteHandler('route1', function(routeData){
		ok('Things work');
		equal(routeData.params.test, true, 'Query params correctly populate routeData.params');
	});
	var app = Doppelganger.create({
		rootUrl: this.folder,
		routes: routes
	});
	History.pushState({}, document.title, this.folder + this.fileName + '?test=true');
	app.init();
	app._destroy();
});