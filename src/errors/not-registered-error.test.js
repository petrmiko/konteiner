const {describe, it} = require('mocha')
const {assert} = require('chai')

const KonteinerNotRegisteredError = require('./not-registered-error')

describe('KonteinerNotRegisteredError', function() {
	const DEP = 'a'

	it('Has correct error class', function() {
		try {
			throw new KonteinerNotRegisteredError(DEP)
		} catch (error) {
			assert.equal(error.name, 'KonteinerNotRegisteredError')
		}
	})

	it('Has correct error message', function() {
		try {
			throw new KonteinerNotRegisteredError(DEP)
		} catch (error) {
			assert.equal(error.message, `Dependency "${DEP}" is not registered`)
		}
	})

	it('Has correct custom properties', function() {
		try {
			throw new KonteinerNotRegisteredError(DEP)
		} catch (error) {
			assert.strictEqual(error.dependency, DEP)
		}
	})
})
