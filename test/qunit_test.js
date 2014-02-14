var Doppelganger = window.Doppelganger;
test('basic test', function() {
	expect(1);
	
	// var routes = {
	// route1: 'testing',
	// route2: 'foo'
	// };
	var filters = this.filters = [
		'bar','baz'
	];
	
	var app = Doppelganger.create({
		routes: [],
		filters: filters
	});
	
	//equal(app.router.get('route1'), routes.route1, 'route1 should be returned.');
	equal(app.filterManager.filters[1], filters[1], 'filter2 should be returned.');
});
