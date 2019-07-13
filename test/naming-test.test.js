const {describe, it} = require('mocha')

describe.skip('Naming test', function() {

	// this file should be only loaded in konteiner.test.js, does not test anything
	it('Some scenario')
})
