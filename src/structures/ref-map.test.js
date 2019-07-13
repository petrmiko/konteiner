const {describe, it} = require('mocha')
const {assert} = require('chai')
const sinon = require('sinon')

const {Ref} = require('./refs')
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
			refMap.add(loggerRef)
			assert.strictEqual(refMap.get('logger'), loggerRef)
			assert.throws(() => refMap.get('messenger'), 'Dependency "messenger" is not registered')
			assert.isUndefined(messengerRef.dependenciesRefs.get('logger'))

			// messenger registered
			refMap.add(messengerRef)
			assert.strictEqual(refMap.get('logger'), loggerRef)
			assert.strictEqual(refMap.get('messenger'), messengerRef)
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
})
