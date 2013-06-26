'use strict';

var Doppelganger = require('../dist/doppelganger.js');

exports['basic'] = {
	setUp: function(done) {
		// setup here
		done();
	},
	'Successful Test': function(test) {
		var app = new Doppelganger();
		var routes = {
			route1: 'testing',
			route2: 'foo'
		};
		var filters = {
			filter1: 'bar',
			filter2: 'baz'
		};
		app.create({
			routes: routes,
			filters: filters
		});
		test.expect(2);
		test.equal(app.getRoute('route1'), routes.route1, 'route1 should be returned.');
		test.equal(app.getFilter('filter2'), filters.filter2, 'filter2 should be returned.');
		test.done();
	},
};