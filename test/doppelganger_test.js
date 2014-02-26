'use strict';

var Doppelganger = require('../dist/doppelganger.js');

exports['basic'] = {
	setUp: function(done) {
		// setup here
		done();
	},
	'Successful Test': function(test) {
		//routes are objects
		var routes = [
			{name: 'route1', url:"route1"},
			{name: 'route2', url: "route2"}
		];
		//filters are a dumb array
		var filters = [
			'bar','baz'
		];
		var app = Doppelganger.create({
			routes: routes,
			filters: filters
		});
		test.expect(3);
		test.equal(app.routeManager.routes[0], routes[0], 'route should be returned when directly accessed.');
		test.equal(app.routeManager.get(1), routes[0], 'route should be returned when using getter.');
		test.equal(app.filterManager.filters[1], filters[1], 'filter should be returned.');
		test.done();
	},
};