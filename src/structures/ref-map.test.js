import {describe, it, beforeEach, afterEach} from 'mocha'
import {assert} from 'chai'
import sinon from 'sinon'

import Ref from './ref.js'
import RefMap from './ref-map.js'
import SimpleRef from './simple-ref.js'

describe('RefMap', function() {

	describe('add', function() {

		let logStub
		beforeEach(function() {
			logStub = sinon.stub(console, 'log')
		})

		afterEach(function() {
			logStub.restore()
		})

		it('Stores reference and updates its dependencies refs by existing mapping', function(){
			const refMap = new RefMap()

			const Logger = () => ({log: sinon.spy()})
			const Messenger = /** @param {import('../konteiner.js').default} konteiner */ function(konteiner) {
				const logger = konteiner.get(Logger)
				return {
					sendMessage(text) {logger.log(text)}
				}
			}
			const loggerRef = new Ref(Logger)
			const messengerRef = new Ref(Messenger)

			// before registering logger
			assert.isUndefined(refMap.get(Logger))
			assert.isUndefined(refMap.get(Messenger))

			// logger registered
			refMap.add(Logger, null, ['logging'])
			assert.deepEqual(refMap.get(Logger), loggerRef)
			assert.sameDeepMembers(refMap.getByTag('logging'), [loggerRef])

			// messenger registered
			refMap.add(Messenger, null, ['messaging'])
			assert.deepEqual(refMap.get(Logger), loggerRef)
			assert.sameDeepMembers(refMap.getByTag('logging'), [loggerRef])
			assert.deepEqual(refMap.get(Messenger), messengerRef)
			assert.sameDeepMembers(refMap.getByTag('messaging'), [messengerRef])
		})

		it('Readdition - same ref - logged console hint', function() {
			const PATH = '{testPath}'
			const refMap = new RefMap()
			const Logger = () => ({log: sinon.spy()})

			const ref = new Ref(Logger, PATH)

			refMap.add(Logger, PATH)
			refMap.add(Logger, PATH)

			sinon.assert.calledOnce(logStub)
			sinon.assert.calledWith(logStub, 'Attempt to re-add', new SimpleRef(ref), ', ignoring...')
		})

		it('Readdition - different ref path - logged console hint', function() {
			const refMap = new RefMap()
			const Logger = () => ({log: sinon.spy()})

			const ref1 = new Ref(Logger, '{testPath}')
			const ref2 = new Ref(Logger, '{testPathNew}')

			refMap.add(Logger, '{testPath}')
			refMap.add(Logger, '{testPathNew}')


			sinon.assert.calledOnce(logStub)
			sinon.assert.calledWithExactly(logStub, 'Overriding', new SimpleRef(ref1), 'with', new SimpleRef(ref2))
		})
	})

	describe('get', function() {
		it('Just passes data from refsByCreator', function() {
			const refMap = new RefMap()
			const DEP_CREATOR = () => {}
			const DEP_REF = new Ref(DEP_CREATOR)
			refMap.refsByCreator.set(DEP_CREATOR, DEP_REF)

			assert.strictEqual(refMap.get(DEP_CREATOR), DEP_REF)
		})
	})

	describe('getByTag', function() {
		it('Throws error when no such dependency', function() {
			const refMap = new RefMap()
			assert.throws(() => refMap.getByTag('tagWithoutDependencies'), 'No dependency with tag "tagWithoutDependencies" is registered')
		})

		it('Returns all refs for registered tag', function() {
			const refMap = new RefMap()
			const DEP_CREATOR = () => {}
			const TAG = '{tag}'
			const REFS = [new Ref(DEP_CREATOR), new Ref(DEP_CREATOR)]

			refMap.refsByTag.set(TAG, REFS)

			assert.strictEqual(refMap.getByTag(TAG), REFS)
		})

		it('Provides registered refs', function() {
			const refMap = new RefMap()
			const TAG = '{tag}'

			const DEP_CREATOR_A = () => 'a'
			const DEP_CREATOR_B = () => 'b'

			const refA = new Ref(DEP_CREATOR_A)
			const refB = new Ref(DEP_CREATOR_B)

			refMap.add(DEP_CREATOR_A, null, [TAG])
			refMap.add(DEP_CREATOR_B, null, [TAG])

			assert.sameDeepMembers(refMap.getByTag(TAG), [refA, refB])
		})
	})

	describe('remove', function() {
		it('Removes registered ref from refMap, provides success flag', function() {
			const refMap = new RefMap()
			const TAG = '{tag}'

			const DEP_CREATOR_A = () => 'a'
			const DEP_CREATOR_B = () => 'b'

			const refB = new Ref(DEP_CREATOR_B)

			refMap.add(DEP_CREATOR_A, null, [TAG])
			refMap.add(DEP_CREATOR_B, null, [TAG])

			assert.isTrue(refMap.remove(DEP_CREATOR_A))
			assert.isUndefined(refMap.get(DEP_CREATOR_A))
			assert.deepEqual(refMap.get(DEP_CREATOR_B), refB)
			assert.sameDeepMembers(refMap.getByTag(TAG), [refB])
		})

		it('Does nothing to registered refs and provides failure flag for non-registered dep removal', function() {
			const refMap = new RefMap()
			const TAG = '{tag}'

			const DEP_CREATOR_A = () => 'a'
			const DEP_CREATOR_B = () => 'b'
			const DEP_CREATOR_C = () => 'c'

			const refA = new Ref(DEP_CREATOR_A)
			const refB = new Ref(DEP_CREATOR_B)
			refMap.add(DEP_CREATOR_A, null, [TAG])
			refMap.add(DEP_CREATOR_B, null, [TAG])

			assert.isFalse(refMap.remove(DEP_CREATOR_C))
			assert.deepEqual(refMap.get(DEP_CREATOR_A), refA)
			assert.deepEqual(refMap.get(DEP_CREATOR_B), refB)
			assert.sameDeepMembers(refMap.getByTag(TAG), [refA, refB])
		})
	})

	describe('getDependencyMap', function() {
		it('Provides simplified map', function() {
			const refMap = new RefMap()

			const DEP_CREATOR_A = () => {}
			const DEP_CREATOR_B = () => {}
			const DEP_CREATOR_C = () => {}

			refMap.add(DEP_CREATOR_A)
			refMap.add(DEP_CREATOR_B)
			refMap.add(DEP_CREATOR_C)

			// this linking is otherwise done during instantiating process
			refMap.get(DEP_CREATOR_A).dependenciesRefs.add(refMap.get(DEP_CREATOR_B))
			refMap.get(DEP_CREATOR_B).dependenciesRefs.add(refMap.get(DEP_CREATOR_C))

			assert.deepEqual(refMap.getDependencyMap(), new Map([
				[DEP_CREATOR_A, new SimpleRef(refMap.get(DEP_CREATOR_A))],
				[DEP_CREATOR_B, new SimpleRef(refMap.get(DEP_CREATOR_B))],
				[DEP_CREATOR_C, new SimpleRef(refMap.get(DEP_CREATOR_C))],
			]))
		})
	})
})
