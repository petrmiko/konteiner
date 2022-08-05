import {describe, it} from 'mocha'
import {assert} from 'chai'
import sinon from 'sinon'

import Konteiner from '../konteiner.js'
import Ref from './ref.js'
import KonteinerAnonymousNoPathDepCreatorError from '../errors/anonymous-dep-no-path-creator-error.js'

describe('Ref', function() {

	const STUB_KONTEINER = sinon.createStubInstance(Konteiner)

	describe('Anonymous dependency creator support', function() {
		it('Throws error for anonymous fn creator without source path', function() {
			assert.throws(() => new Ref(() => {}), KonteinerAnonymousNoPathDepCreatorError)
		})

		it('No error for anonymous fn creator with source path, sets placeholder name', function() {
			const ref = new Ref(() => {}, '{path}')
			assert.deepInclude(ref, {
				name: '{anonymous Fn}',
				path: '{path}'
			})
		})
	})

	describe('Callable dependency', function() {
		it('Is lazy initialized', function() {
			const IMPLEMENTATION = '{someImplementation}'
			const CALLABLE = () => IMPLEMENTATION

			const ref = new Ref(CALLABLE)

			assert.isFalse(ref.initialized)
			assert.isUndefined(ref.instance)

			assert.strictEqual(ref.getInstance(STUB_KONTEINER), IMPLEMENTATION)
			assert.strictEqual(ref.instance, IMPLEMENTATION)
			assert.isTrue(ref.initialized)
		})

		it('Provides konteiner instance for inner retrieving of other dependencies', function() {
			const IMPLEMENTATION = '{someImplementation}'

			const DEP1_INSTANCE = {
				doSomething: sinon.spy(),
			}
			const DEP2_INSTANCE = {
				doSomethingElse: sinon.spy(),
			}
			const DEP1 = () => DEP1_INSTANCE
			const DEP2 = () => DEP2_INSTANCE
			const KONTEINER_STUB = sinon.createStubInstance(Konteiner)
			KONTEINER_STUB.get.withArgs(DEP1).returns(DEP1_INSTANCE)
			KONTEINER_STUB.get.withArgs(DEP2).returns(DEP2_INSTANCE)


			const CALLABLE = /** @param {Konteiner} konteiner */ (konteiner) => {
				konteiner.get(DEP1).doSomething()
				konteiner.get(DEP2).doSomethingElse()
				return IMPLEMENTATION
			}

			const ref = new Ref(CALLABLE)
			assert.isFalse(ref.initialized)
			assert.strictEqual(ref.getInstance(KONTEINER_STUB), IMPLEMENTATION)

			assert.isTrue(ref.initialized)
			sinon.assert.calledOnce(DEP1_INSTANCE.doSomething)
			sinon.assert.calledOnce(DEP2_INSTANCE.doSomethingElse)
		})
	})

	describe('Constructible dependency - class', function() {
		it('Is lazy initialized', function() {
			class Constructible {
				constructor(konteiner) {
					this.konteiner = konteiner
				}

				someFn() { return '{value}' }
			}
			const instance = new Constructible(STUB_KONTEINER)

			const ref = new Ref(Constructible)

			assert.isFalse(ref.initialized)
			assert.isUndefined(ref.instance)
			assert.deepEqual(ref.getInstance(STUB_KONTEINER), instance)

			assert.isTrue(ref.initialized)
			assert.isTrue(ref.instance instanceof Constructible)
			assert.deepEqual(ref.instance, instance)
			assert.equal(ref.getInstance(STUB_KONTEINER).someFn(), '{value}')
		})

		it('Provides konteiner instance for inner retrieving of other dependencies', function() {
			const DEP1_INSTANCE = {
				doSomething: sinon.spy(),
			}
			const DEP2_INSTANCE = {
				doSomethingElse: sinon.spy(),
			}
			const DEP1 = () => DEP1_INSTANCE
			const DEP2 = () => DEP2_INSTANCE
			const KONTEINER_STUB = sinon.createStubInstance(Konteiner)
			KONTEINER_STUB.get.withArgs(DEP1).returns(DEP1_INSTANCE)
			KONTEINER_STUB.get.withArgs(DEP2).returns(DEP2_INSTANCE)

			class Constructible {
				/**
				 * @param {Konteiner} konteiner
				 */
				constructor(konteiner) {
					this.dep1 = konteiner.get(DEP1)
					this.dep2 = konteiner.get(DEP2)
				}

				someFn() {
					this.dep1.doSomething()
					this.dep2.doSomethingElse()
				}
			}
			const instance = new Constructible(KONTEINER_STUB)

			const ref = new Ref(Constructible)

			assert.isFalse(ref.initialized)
			assert.deepEqual(ref.getInstance(KONTEINER_STUB), instance)

			assert.isTrue(ref.initialized)
			assert.isTrue(ref.instance instanceof Constructible)
			assert.deepEqual(ref.instance, instance)

			ref.instance.someFn()
			sinon.assert.calledOnce(DEP1_INSTANCE.doSomething)
			sinon.assert.calledOnce(DEP2_INSTANCE.doSomethingElse)
		})

	})
})
