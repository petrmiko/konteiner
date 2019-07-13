const {describe, it} = require('mocha')
const {assert} = require('chai')

const KonteinerMissingDependenciesError = require('./missing-deps-error')

describe('KonteinerCyclicDepError', function() {
	const DEPS = ['a', 'b', 'c']

	it('Has correct error class', function() {
		try {
			throw new KonteinerMissingDependenciesError(DEPS)
		} catch (error) {
			assert.equal(error.name, 'KonteinerMissingDependenciesError')
		}
	})

	it('Has correct error message', function() {
		try {
			throw new KonteinerMissingDependenciesError(DEPS)
		} catch (error) {
			assert.equal(error.message, 'Missing dependencies! ["a","b","c"]')
		}
	})

	it('Has correct custom properties', function() {
		try {
			throw new KonteinerMissingDependenciesError(DEPS)
		} catch (error) {
			assert.strictEqual(error.dependencies, DEPS)
		}
	})
})
