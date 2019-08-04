const {describe, it} = require('mocha')
const {assert} = require('chai')
const sinon = require('sinon')

const Ref = require('./ref')
const RefMap = require('./ref-map')

describe('RefMap', function() {

	describe('add', function() {
		it('Stores reference and updates its dependencies refs by existing mapping', function(){
			const refMap = new RefMap()

			const Logger = {log: sinon.spy()}
			const Messenger = function(logger) {
				return {
					sendMessage(text) {logger.log(text)}
				}
			}
			const loggerRef = new Ref('logger', Logger)
			const messengerRef = new Ref('messenger', Messenger)

			// before registering logger
			assert.throws(() => refMap.get('logger'), 'Dependency "logger" is not registered')
			assert.throws(() => refMap.get('messenger'), 'Dependency "messenger" is not registered')
			assert.isUndefined(messengerRef.dependenciesRefs.get('logger'))

			// logger registered
			refMap.add(loggerRef, ['logging'])
			assert.strictEqual(refMap.get('logger'), loggerRef)
			assert.sameMembers(refMap.getByTag('logging'), [loggerRef])
			assert.isUndefined(messengerRef.dependenciesRefs.get('logger'))

			// messenger registered
			refMap.add(messengerRef, ['messaging'])
			assert.strictEqual(refMap.get('logger'), loggerRef)
			assert.sameMembers(refMap.getByTag('logging'), [loggerRef])
			assert.strictEqual(refMap.get('messenger'), messengerRef)
			assert.sameMembers(refMap.getByTag('messaging'), [messengerRef])
			assert.strictEqual(messengerRef.dependenciesRefs.get('logger'), loggerRef)
		})
	})

	describe('get', function() {
		it('Throws error when no such dependency', function() {
			const refMap = new RefMap()

			assert.throws(() => refMap.get('unregisteredDependency'), 'Dependency "unregisteredDependency" is not registered')
		})

		it('Throws error when found cyclic dependency upon get', function() {
			const refMap = new RefMap()

			const a = (b) => {} //eslint-disable-line no-unused-vars
			const b = (c) => {} //eslint-disable-line no-unused-vars
			const c = (a) => {} //eslint-disable-line no-unused-vars

			// no errors during addition
			refMap.add(new Ref('a', a))
			refMap.add(new Ref('b', b))
			refMap.add(new Ref('c', c))

			assert.throws(() => refMap.get('a'), 'Cyclic dependency found! ["a"->"b"->"c"->"a"]')
			assert.throws(() => refMap.get('b'), 'Cyclic dependency found! ["b"->"c"->"a"->"b"]')
			assert.throws(() => refMap.get('c'), 'Cyclic dependency found! ["c"->"a"->"b"->"c"]')
		})
	})

	describe('getByTag', function() {
		it('Throws error when no such dependency', function() {
			const refMap = new RefMap()
			assert.throws(() => refMap.getByTag('tagWithoutDependencies'), 'No dependency with tag "tagWithoutDependencies" is registered')
		})

		it('Throws error when found cyclic dependency upon get', function() {
			const refMap = new RefMap()
			const TAG = '{tag}'

			const a = (b) => {} //eslint-disable-line no-unused-vars
			const b = (c) => {} //eslint-disable-line no-unused-vars
			const c = (a) => {} //eslint-disable-line no-unused-vars

			// no errors during addition
			refMap.add(new Ref('a', a), [TAG])
			refMap.add(new Ref('b', b), [TAG])
			refMap.add(new Ref('c', c), [TAG])

			assert.throws(() => refMap.getByTag(TAG), 'Cyclic dependency found! ["a"->"b"->"c"->"a"]')
		})

		it('Provides registered refs', function() {
			const refMap = new RefMap()
			const TAG = '{tag}'

			const refA = new Ref('a', () => 'a')
			const refB = new Ref('b', () => 'b')
			const refC = new Ref('c', () => 'c')

			refMap.add(refA, [TAG])
			refMap.add(refB, [TAG])
			refMap.add(refC, [TAG])

			assert.sameMembers(refMap.getByTag(TAG), [refA, refB, refC])
		})
	})

	describe('remove', function() {
		it('Removes registered ref from refMap, provides success flag', function() {
			const refMap = new RefMap()
			const TAG = '{tag}'

			const refA = new Ref('a', () => 'a')
			const refB = new Ref('b', () => 'b')
			refMap.add(refA, [TAG])
			refMap.add(refB, [TAG])

			assert.isTrue(refMap.remove('a'))
			assert.throws(() => refMap.get('a'), 'Dependency "a" is not registered')
			assert.sameMembers(refMap.getByTag(TAG), [refB])

			assert.deepEqual(refMap.getDependencyMap(), new Map([
				[undefined, [Ref.toSimpleRef(refB)]],
			]))
		})
	})

	describe('getDependencyMap', function() {
		it('Provides simplified overview of where is ref provided into as dependency', function() {
			const refMap = new RefMap()

			const refA = new Ref('a', (b) => 'a') // eslint-disable-line no-unused-vars
			const refB = new Ref('b', () => 'b')
			const refC = new Ref('c', (a, b) => 'c') // eslint-disable-line no-unused-vars
			refMap.add(refA)
			refMap.add(refB)
			refMap.add(refC)

			assert.deepEqual(refMap.getDependencyMap(), new Map([
				[undefined, [Ref.toSimpleRef(refB)]],
				[Ref.toSimpleRef(refA), [Ref.toSimpleRef(refC)]],
				[Ref.toSimpleRef(refB), [Ref.toSimpleRef(refA), Ref.toSimpleRef(refC)]],
			]))
		})
	})
})
