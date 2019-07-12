const {describe, it} = require('mocha')
const {assert} = require('chai')
const sinon = require('sinon')

const Ref = require('./ref')

describe('Ref', function() {

	describe('No init dependency', function() {
		it('Provides string value as received', function() {
			const STRING = '{testString}'
			const ref = new Ref('{refName}', STRING)

			assert.isTrue(ref.isInitialized())
			assert.isEmpty(ref.getDependenciesNames())
			assert.strictEqual(ref.getInstance(), STRING)
		})

		it('Provides number value as received', function() {
			const NUMBER = 42
			const ref = new Ref('{refName}', NUMBER)

			assert.isTrue(ref.isInitialized())
			assert.isEmpty(ref.getDependenciesNames())
			assert.strictEqual(ref.getInstance(), NUMBER)
		})

		it('Provides object value as received', function() {
			const CONFIG = {
				someValue: 1,
				anotherValue: 2,
			}
			const ref = new Ref('{refName}', CONFIG)

			assert.isTrue(ref.isInitialized())
			assert.isEmpty(ref.getDependenciesNames())
			assert.strictEqual(ref.getInstance(), CONFIG)
		})
	})

	describe('Callable dependency', function() {
		it('Is lazy initialized', function() {
			const IMPLEMENTATION = '{someImplementation}'
			const CALLABLE = () => IMPLEMENTATION

			const ref = new Ref('{callable}', CALLABLE)

			assert.isFalse(ref.isInitialized())
			assert.isUndefined(ref.getInstance())

			ref.initialize()
			assert.isTrue(ref.isInitialized())
			assert.strictEqual(ref.getInstance(), IMPLEMENTATION)
		})

		it('Provides correct dependencies names', function() {
			const CALLABLE = (dep1, dep2, dep3, dep4) => {} //eslint-disable-line no-unused-vars

			const ref = new Ref('{callable}', CALLABLE)
			assert.sameOrderedMembers(ref.getDependenciesNames(), ['dep1', 'dep2', 'dep3', 'dep4'])
		})

		it('Throws error, when not registered dependency instance', function() {
			const CALLABLE = (unfulfilledDep) => {
				unfulfilledDep.doSomething()
			}
			const ref = new Ref('{callable}', CALLABLE)
			const dependenciesRefs = new Map()
			try {
				ref.initialize(dependenciesRefs)
				assert.fail()
			} catch (error) {
				assert.equal(error.message, 'Missing dependencies! ["unfulfilledDep"]')
			}
		})

		it('Provides initialized instance by dependencies', function() {
			const IMPLEMENTATION = '{someImplementation}'
			const CALLABLE = (dep1, dep2) => {
				dep1.doSomething()
				dep2.doSomethingElse()
				return IMPLEMENTATION
			}

			const ref = new Ref('{callable}', CALLABLE)

			const dep1 = {
				doSomething: sinon.spy(),
			}
			const dep1Ref = new Ref('dep1', () => dep1)
			dep1Ref.initialize()
			const dep2 = {
				doSomethingElse: sinon.spy(),
			}
			const dep2Ref = new Ref('dep2', () => dep2)
			dep2Ref.initialize()

			const dependenciesRefs = new Map([
				[dep1Ref.getName(), dep1Ref],
				[dep2Ref.getName(), dep2Ref],
			])

			ref.updateDependenciesRefs(dependenciesRefs)
			ref.initialize()

			assert.isTrue(ref.isInitialized())
			assert.strictEqual(ref.getInstance(), IMPLEMENTATION)
			sinon.assert.calledOnce(dep1.doSomething)
			sinon.assert.calledOnce(dep2.doSomethingElse)
		})
	})

	describe('Constructible dependency - common function', function() {
		it('Is lazy initialized', function() {
			const CONSTRUCTIBLE = function() {
				const someFn = function() { return '{value}'}
				return {someFn}
			}

			const ref = new Ref('{constructible}', CONSTRUCTIBLE)

			assert.isFalse(ref.isInitialized())
			assert.isUndefined(ref.getInstance())

			ref.initialize()
			assert.isTrue(ref.isInitialized())
			assert.equal(ref.getInstance().someFn(), '{value}')
		})

		it('Provides correct dependencies names', function() {
			const CONSTRUCTIBLE = function(dep1, dep2, dep3, dep4) {} //eslint-disable-line no-unused-vars

			const ref = new Ref('{constructible}', CONSTRUCTIBLE)
			assert.sameOrderedMembers(ref.getDependenciesNames(), ['dep1', 'dep2', 'dep3', 'dep4'])
		})

		it('Throws error, when not registered dependency instance', function() {
			const CONSTRUCTIBLE = function(unfulfilledDep) {
				unfulfilledDep.doSomething()
			}
			const ref = new Ref('{constructible}', CONSTRUCTIBLE)
			const dependenciesRefs = new Map()
			try {
				ref.initialize(dependenciesRefs)
				assert.fail()
			} catch (error) {
				assert.equal(error.message, 'Missing dependencies! ["unfulfilledDep"]')
			}
		})

		it('Provides initialized instance by dependencies', function() {
			const CONSTRUCTIBLE = function(dep1, dep2) {
				dep1.doSomething()
				dep2.doSomethingElse()
				const someFn = function() { return '{value}'}

				return {someFn}
			}

			const ref = new Ref('{constructible}', CONSTRUCTIBLE)

			const dep1 = {
				doSomething: sinon.spy(),
			}
			const dep1Ref = new Ref('dep1', function() { return dep1})
			dep1Ref.initialize()
			const dep2 = {
				doSomethingElse: sinon.spy(),
			}
			const dep2Ref = new Ref('dep2', function() { return dep2})
			dep2Ref.initialize()

			const dependenciesRefs = new Map([
				[dep1Ref.getName(), dep1Ref],
				[dep2Ref.getName(), dep2Ref],
			])

			ref.updateDependenciesRefs(dependenciesRefs)
			ref.initialize()

			assert.isTrue(ref.isInitialized())
			assert.equal(ref.getInstance().someFn(), '{value}')
			sinon.assert.calledOnce(dep1.doSomething)
			sinon.assert.calledOnce(dep2.doSomethingElse)
		})
	})

	describe('Constructible dependency - class', function() {
		it('Is lazy initialized', function() {
			class Constructible {
				constructor() {}

				someFn() { return '{value}' }
			}

			const ref = new Ref('{constructible}', Constructible)

			assert.isFalse(ref.isInitialized())
			assert.isUndefined(ref.getInstance())

			ref.initialize()
			assert.isTrue(ref.isInitialized())
			assert.isTrue(ref.getInstance() instanceof Constructible)
			assert.equal(ref.getInstance().someFn(), '{value}')
		})

		it('Provides correct dependencies names', function() {
			class Constructible {
				constructor(dep1, dep2, dep3, dep4) {} //eslint-disable-line no-unused-vars
			}

			const ref = new Ref('{constructible}', Constructible)
			assert.sameOrderedMembers(ref.getDependenciesNames(), ['dep1', 'dep2', 'dep3', 'dep4'])
		})

		it('Throws error, when not registered dependency instance', function() {
			class Constructible {
				constructor(unfulfilledDep) {
					unfulfilledDep.doSomething()
				}
			}
			const ref = new Ref('{constructible}', Constructible)
			const dependenciesRefs = new Map()
			try {
				ref.initialize(dependenciesRefs)
				assert.fail()
			} catch (error) {
				assert.equal(error.message, 'Missing dependencies! ["unfulfilledDep"]')
			}
		})

		it('Provides initialized instance by dependencies', function() {
			class Constructible {
				constructor(dep1, dep2) {
					dep1.doSomething()
					dep2.doSomethingElse()
				}

				someFn() { return '{value}'}
			}

			const ref = new Ref('constructible', Constructible)

			const dep1 = {
				doSomething: sinon.spy(),
			}
			const dep1Ref = new Ref('dep1', () => dep1)
			dep1Ref.initialize()
			const dep2 = {
				doSomethingElse: sinon.spy(),
			}
			const dep2Ref = new Ref('dep2', () => dep2)
			dep2Ref.initialize()

			const dependenciesRefs = new Map([
				[dep1Ref.getName(), dep1Ref],
				[dep2Ref.getName(),  dep2Ref],
			])

			ref.updateDependenciesRefs(dependenciesRefs)
			ref.initialize()

			assert.isTrue(ref.isInitialized())
			assert.equal(ref.getInstance().someFn(), '{value}')
			sinon.assert.calledOnce(dep1.doSomething)
			sinon.assert.calledOnce(dep2.doSomethingElse)
		})
	})
})
