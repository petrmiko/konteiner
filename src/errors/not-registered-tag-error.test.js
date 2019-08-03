const {describe, it} = require('mocha')
const {assert} = require('chai')

const KonteinerNotRegisteredTagError = require('./not-registered-tag-error')

describe('KonteinerNotRegisteredTagError', function() {
	const TAG = '{tag}'

	it('Has correct error class', function() {
		try {
			throw new KonteinerNotRegisteredTagError(TAG)
		} catch (error) {
			assert.equal(error.name, 'KonteinerNotRegisteredTagError')
		}
	})

	it('Has correct error message', function() {
		try {
			throw new KonteinerNotRegisteredTagError(TAG)
		} catch (error) {
			assert.equal(error.message, `No dependency with tag "${TAG}" is registered`)
		}
	})

	it('Has correct custom properties', function() {
		try {
			throw new KonteinerNotRegisteredTagError(TAG)
		} catch (error) {
			assert.strictEqual(error.tag, TAG)
		}
	})
})
