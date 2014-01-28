'use strict';

var Doppelganger = require('../dist/doppelganger.js');

exports['basic'] = {
	setUp: function(done) {
		// setup here
		done();
	},
	'Successful Test': function(test) {
		var app = new Doppelganger();
		//routes are objects
		var routes = {
			route1: 'testing',
			route2: 'foo'
		};
		//filters are a dumb array
		var filters = [
			'bar','baz'
		];
		app.create({
			routes: routes,
			filters: filters
		});
		test.expect(2);
		test.equal(app.router.get('route1'), routes.route1, 'route1 should be returned.');
		test.equal(app.filterManager.filters[1], filters[1], 'filter2 should be returned.');
		test.done();
	},
};