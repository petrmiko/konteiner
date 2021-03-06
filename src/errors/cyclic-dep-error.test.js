const {describe, it} = require('mocha')
const {assert} = require('chai')

const KonteinerCyclicDepError = require('./cyclic-dep-error')

describe('KonteinerCyclicDepError', function() {
	const DEPS = ['a', 'b', 'c', 'a']

	it('Has correct error class', function() {
		try {
			throw new KonteinerCyclicDepError(DEPS)
		} catch (error) {
			assert.equal(error.name, 'KonteinerCyclicDepError')
		}
	})

	it('Has correct error message', function() {
		try {
			throw new KonteinerCyclicDepError(DEPS)
		} catch (error) {
			assert.equal(error.message, 'Cyclic dependency found! ["a"->"b"->"c"->"a"]')
		}
	})

	it('Has correct custom properties', function() {
		try {
			throw new KonteinerCyclicDepError(DEPS)
		} catch (error) {
			assert.strictEqual(error.dependencies, DEPS)
		}
	})
})
