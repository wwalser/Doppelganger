'use strict';

var lazify = require('../dist/doppelganger.js');

exports['basic'] = {
	setUp: function(done) {
		// setup here
		done();
	},
	'Successful Test': function(test) {
		test.expect(1);
		test.equal(true, true, 'Things are true');
		test.done();
	},
}