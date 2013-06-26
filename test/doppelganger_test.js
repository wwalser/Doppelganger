'use strict';

var Doppelganger = require('../dist/doppelganger.js');

exports['basic'] = {
	setUp: function(done) {
		// setup here
		done();
	},
	'Successful Test': function(test) {
		var app = new Doppelganger();
		app.create();
		test.expect(1);
		test.equal(true, true, 'Things are true');
		test.done();
	},
};