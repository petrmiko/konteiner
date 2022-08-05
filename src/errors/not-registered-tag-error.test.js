import {describe, it} from 'mocha'
import {assert} from 'chai'

import KonteinerNotRegisteredTagError from './not-registered-tag-error.js'

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
