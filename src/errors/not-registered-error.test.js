import {describe, it} from 'mocha'
import {assert} from 'chai'

import KonteinerNotRegisteredError from'./not-registered-error.js'

describe('KonteinerNotRegisteredError', function() {
	const DEP = () => {}

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
			assert.equal(error.message, `Dependency "${DEP.name}" is not registered`)
		}
	})

	it('Has correct custom properties', function() {
		try {
			throw new KonteinerNotRegisteredError(DEP)
		} catch (error) {
			assert.strictEqual(error.dependencyCreator, DEP)
		}
	})
})
