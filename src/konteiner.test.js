const {describe, it} = require('mocha')
const {assert} = require('chai')
const path = require('path')
const sinon = require('sinon')

const Konteiner = require('./konteiner')
const Ref = require('./structures/ref')
const KonteinerNotRegisteredError = require('./errors/not-registered-error')
const KonteinerCyclicDepError = require('./errors/cyclic-dep-error')

describe('Konteiner', function() {


	describe('dependency support', function() {
		it('Arrow function dependency', function() {
			const TEST_MESSAGE = '{testMessage}'
			const LOGGER_FN = sinon.spy()

			const Logger = () => ({
				log: LOGGER_FN,
			})

			const Messenger = /** @param {Konteiner} konteiner */ (konteiner) => ({
				sendMessage(message) {
					const logger = konteiner.get(Logger)
					logger.log(message)
				}
			})

			const konteiner = new Konteiner()
			konteiner.register(Logger)
			konteiner.register(Messenger)

			const retrievedMessenger = konteiner.get(Messenger)
			retrievedMessenger.sendMessage(TEST_MESSAGE)
			sinon.assert.calledOnce(LOGGER_FN)
			sinon.assert.calledWithExactly(LOGGER_FN, TEST_MESSAGE)
		})

		it('Regular anonymous function dependency', function() {
			const TEST_MESSAGE = '{testMessage}'
			const LOGGER_FN = sinon.spy()

			const Logger = function() {
				return {log: LOGGER_FN}
			}

			const Messenger = /** @param {Konteiner} konteiner */ function(konteiner) {
				const logger = konteiner.get(Logger)
				return {
					sendMessage(message) {
						logger.log(message)
					}

				}
			}

			const konteiner = new Konteiner()
			konteiner.register(Logger)
			konteiner.register(Messenger)

			const retrievedMessenger =konteiner.get(Messenger)
			retrievedMessenger.sendMessage(TEST_MESSAGE)
			sinon.assert.calledOnce(LOGGER_FN)
			sinon.assert.calledWithExactly(LOGGER_FN, TEST_MESSAGE)
		})

		it('Regular named function dependency', function() {
			const TEST_MESSAGE = '{testMessage}'
			const LOGGER_FN = sinon.spy()

			const Logger = function logger() {
				return {log: LOGGER_FN}
			}

			const Messenger = /** @param {Konteiner} konteiner */ function messenger(konteiner) {
				const logger = konteiner.get(Logger)
				return {
					sendMessage(message) {
						logger.log(message)
					}

				}
			}

			const konteiner = new Konteiner()
			konteiner.register(Logger)
			konteiner.register(Messenger)

			const retrievedMessenger = konteiner.get(Messenger)
			retrievedMessenger.sendMessage(TEST_MESSAGE)
			sinon.assert.calledOnce(LOGGER_FN)
			sinon.assert.calledWithExactly(LOGGER_FN, TEST_MESSAGE)
		})

		it('Class dependency', function() {
			const TEST_MESSAGE = '{testMessage}'
			const LOGGER_FN = sinon.spy()

			class Logger {
				constructor() {
					this.log = LOGGER_FN
				}
			}

			class Messenger  {
				/**
				 * @param {Konteiner} konteiner
				 */
				constructor(konteiner) {
					this.logger = konteiner.get(Logger)
				}

				sendMessage(message) {
					this.logger.log(message)
				}
			}

			const konteiner = new Konteiner()
			konteiner.register(Logger)
			konteiner.register(Messenger)

			const retrievedMessenger = konteiner.get(Messenger)
			retrievedMessenger.sendMessage(TEST_MESSAGE)
			sinon.assert.calledOnce(LOGGER_FN)
			sinon.assert.calledWithExactly(LOGGER_FN, TEST_MESSAGE)
		})
	})

	describe('methods', function() {

		describe('register', function() {
			it('no options - keeps provided name and stores new Ref', function() {
				const IMPLEMENTATION = () => {}
				const konteiner = new Konteiner()

				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.register(IMPLEMENTATION)
				sinon.assert.calledOnce(refMapAdd)
				sinon.assert.calledWith(refMapAdd, IMPLEMENTATION)
			})

			it('options.tags - passes provided tags', function() {
				const IMPLEMENTATION = () => {}
				const TAGS = ['{T1}', '{T2}']

				const konteiner = new Konteiner()

				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.register(IMPLEMENTATION, {tags: TAGS})
				sinon.assert.calledOnce(refMapAdd)
				sinon.assert.calledWith(refMapAdd, IMPLEMENTATION, null, TAGS)
			})
		})

		describe('registerPath', function() {
			const TEST_FILES_DIR = path.join(global.process.cwd(), 'test')

			it('no options - loads all .js files to depth 1 (=specified dir only)', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR)
				sinon.assert.calledTwice(refMapAdd)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js'), undefined)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test-class'), path.join(TEST_FILES_DIR, 'naming-test-class.js'), undefined)
			})

			it('options.dirSearchDepth - -1 loads all .js files recursively', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {dirSearchDepth: -1})
				sinon.assert.callCount(refMapAdd, 3)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/nested/nested-naming-test'), path.join(TEST_FILES_DIR, 'nested', 'nested-naming-test.js'), undefined)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js'), undefined)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test-class'), path.join(TEST_FILES_DIR, 'naming-test-class.js'), undefined)
			})

			it('options.supportedExtensions - loads all supported extensions (so nodejs require handles them)', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {supportedExtensions: ['.js', '.jsx']})
				sinon.assert.callCount(refMapAdd, 3)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js'), undefined)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test.jsx'), path.join(TEST_FILES_DIR, 'naming-test.jsx'), undefined)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test-class'), path.join(TEST_FILES_DIR, 'naming-test-class.js'), undefined)
			})

			it('options.exclude - loads all files not matching exclude patterns', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {exclude: ['\\-class\\.']})
				sinon.assert.callCount(refMapAdd, 1)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js'), undefined)
			})

			it('options.tags - loads all .js files with tags', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {tags: ['test', 'tag']})
				sinon.assert.calledTwice(refMapAdd)
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js'), ['test', 'tag'])
				sinon.assert.calledWithExactly(refMapAdd, require('../test/naming-test-class'), path.join(TEST_FILES_DIR, 'naming-test-class.js'), ['test', 'tag'])
			})
		})

		describe('get', function() {
			it('Retrieves, initializes unitialized dependency and provides instance', function() {
				const konteiner = new Konteiner()
				const INSTANCE = {}
				const DEP_CREATOR = () => {return INSTANCE}
				const TEST_REF = new Ref(DEP_CREATOR)
				sinon.stub(TEST_REF, 'getInstance').callThrough()
				const refMapGet = sinon.stub(konteiner.refMap, 'get').returns(TEST_REF)

				assert.isFalse(TEST_REF.initialized)
				const dependency = konteiner.get(DEP_CREATOR)

				sinon.assert.calledOnce(refMapGet)
				sinon.assert.calledWithExactly(refMapGet, DEP_CREATOR)
				sinon.assert.calledOnce(TEST_REF.getInstance)
				assert.isTrue(TEST_REF.initialized)
				assert.strictEqual(dependency, INSTANCE)
			})

			it('Throws error on get attempt of non-registered dependency creator', function() {
				const DEP_CREATOR = () => {}
				const konteiner = new Konteiner()
				assert.throws(() => konteiner.get(DEP_CREATOR), KonteinerNotRegisteredError)
			})

			it('Detects cyclic dependencies', function() {
				let DEP_CREATOR_A // eslint-disable-line prefer-const
				const DEP_CREATOR_B = (konteiner) => {
					konteiner.get(DEP_CREATOR_A)
				}
				DEP_CREATOR_A = (konteiner) => {
					konteiner.get(DEP_CREATOR_B)
				}
				const konteiner = new Konteiner()
				konteiner.register(DEP_CREATOR_A)
				konteiner.register(DEP_CREATOR_B)
				assert.throws(() => konteiner.get(DEP_CREATOR_A), KonteinerCyclicDepError)
			})
		})

		describe('getByTag', function() {
			it('Retrieves by tag, initializes unitialized dependencies and provides instances', function() {
				const konteiner = new Konteiner()
				const INSTANCE = {}
				const DEP_CREATOR = () => {return INSTANCE}
				const TAG = 'tag'
				const TEST_REF = new Ref(DEP_CREATOR)
				sinon.stub(TEST_REF, 'getInstance').callThrough()
				const refMapGetByTag = sinon.stub(konteiner.refMap, 'getByTag').returns([TEST_REF])
				sinon.stub(konteiner.refMap, 'get').returns(TEST_REF)

				assert.isFalse(TEST_REF.initialized)
				const dependencies = konteiner.getByTag(TAG)

				sinon.assert.calledOnce(refMapGetByTag)
				sinon.assert.calledWithExactly(refMapGetByTag, TAG)
				sinon.assert.calledOnce(TEST_REF.getInstance)
				assert.isTrue(TEST_REF.initialized)
				assert.deepEqual(dependencies, [INSTANCE])
			})
		})

		describe('getDependencyMap', function() {
			it('Only proxies refMap.getDependencyMap', function() {
				const RESULT = '{result}'
				const konteiner = new Konteiner()
				const getDependencyMapStub = sinon.stub(konteiner.refMap, 'getDependencyMap').returns(RESULT)

				const result = konteiner.getDependencyMap()
				assert.strictEqual(result, RESULT)
				sinon.assert.calledOnce(getDependencyMapStub)
			})
		})

		describe('remove', function() {
			it('Only proxies refMap.remove and provides result', function() {
				const RESULT = '{result}'
				const DEP_CREATOR = () => {return RESULT}
				const konteiner = new Konteiner()
				const removeStub = sinon.stub(konteiner.refMap, 'remove').returns(RESULT)

				const result = konteiner.remove(DEP_CREATOR)
				assert.strictEqual(result, RESULT)
				sinon.assert.calledOnce(removeStub)
				sinon.assert.calledWithExactly(removeStub, DEP_CREATOR)
			})
		})
	})

})
