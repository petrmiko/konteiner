const {describe, it} = require('mocha')
const {assert} = require('chai')
const path = require('path')
const sinon = require('sinon')

const Konteiner = require('./konteiner')
const {Ref} = require('./structures/refs')

describe('Konteiner', function() {


	describe('dependency support', function() {
		it('Arrow function dependency', function() {
			const TEST_MESSAGE = '{testMessage}'
			const LOGGER_FN = sinon.spy()

			const Logger = () => ({
				log: LOGGER_FN,
			})

			const Messenger = (logger) => ({
				sendMessage(message) {
					logger.log(message)
				}
			})

			const konteiner = new Konteiner()
			konteiner.register('logger', Logger)
			konteiner.register('messenger', Messenger)

			const retrievedMessenger = /** @type {Messenger}*/ (konteiner.get('messenger'))
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

			const Messenger = function(logger) {

				return {
					sendMessage(message) {
						logger.log(message)
					}

				}
			}

			const konteiner = new Konteiner()
			konteiner.register('logger', Logger)
			konteiner.register('messenger', Messenger)

			const retrievedMessenger = /** @type {Messenger}*/ (konteiner.get('messenger'))
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

			const Messenger = function messenger(logger) {

				return {
					sendMessage(message) {
						logger.log(message)
					}

				}
			}

			const konteiner = new Konteiner()
			konteiner.register('logger', Logger)
			konteiner.register('messenger', Messenger)

			const retrievedMessenger = /** @type {Messenger}*/ (konteiner.get('messenger'))
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
				constructor(logger) {
					this.logger = logger
				}

				sendMessage(message) {
					this.logger.log(message)
				}
			}

			const konteiner = new Konteiner()
			konteiner.register('logger', Logger)
			konteiner.register('messenger', Messenger)

			const retrievedMessenger = /** @type {Messenger}*/ (konteiner.get('messenger'))
			retrievedMessenger.sendMessage(TEST_MESSAGE)
			sinon.assert.calledOnce(LOGGER_FN)
			sinon.assert.calledWithExactly(LOGGER_FN, TEST_MESSAGE)
		})
	})

	describe('methods', function() {

		describe('container - creates new instance as a factory', function() {
			it('no options', function() {
				const konteiner = Konteiner.container()
				assert.instanceOf(konteiner, Konteiner)
				assert.sameMembers(konteiner.exclude, [])
				assert.equal(konteiner.searchDepth, 1)
				assert.sameMembers(konteiner.supportedExtensions, ['.js'])
			})

			it('with options', function() {
				const konteiner = Konteiner.container({
					exclude: ['\\.test\\.'],
					dirSearchDepth: -1,
					supportedExtensions: ['.js', '.json'],
				})
				assert.instanceOf(konteiner, Konteiner)
				assert.sameMembers(konteiner.exclude, ['\\.test\\.'])
				assert.equal(konteiner.searchDepth, -1)
				assert.sameMembers(konteiner.supportedExtensions, ['.js', '.json'])
			})
		})

		describe('register', function() {
			it('no options - keeps provided name and stores new Ref', function() {
				const IMPLEMENTATION = '{implementation}'
				const konteiner = new Konteiner()

				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.register('dep-name', IMPLEMENTATION)
				sinon.assert.calledOnce(refMapAdd)
				sinon.assert.calledWith(refMapAdd, new Ref('dep-name', IMPLEMENTATION))
			})

			it('options.prefix - converts dependency name to camelCase and stores new Ref', function() {
				const IMPLEMENTATION = '{implementation}'
				const konteiner = new Konteiner()

				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.register('dep-name', IMPLEMENTATION, {prefix: 'test-prefix'})
				sinon.assert.calledOnce(refMapAdd)
				sinon.assert.calledWith(refMapAdd, new Ref('testPrefixDepName', IMPLEMENTATION))
			})

			it('options.suffix - converts dependency name to camelCase and stores new Ref', function() {
				const IMPLEMENTATION = '{implementation}'
				const konteiner = new Konteiner()

				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.register('dep-name', IMPLEMENTATION, {suffix: 'with-suffix'})
				sinon.assert.calledOnce(refMapAdd)
				sinon.assert.calledWith(refMapAdd, new Ref('depNameWithSuffix', IMPLEMENTATION))
			})

			it('options.tags - passes provided tags', function() {
				const IMPLEMENTATION = '{implementation}'
				const TAGS = ['{T1}', '{T2}']

				const konteiner = new Konteiner()

				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.register('depName', IMPLEMENTATION, {tags: TAGS})
				sinon.assert.calledOnce(refMapAdd)
				sinon.assert.calledWith(refMapAdd, new Ref('depName', IMPLEMENTATION), TAGS)
			})
		})

		describe('registerPath', function() {
			const TEST_FILES_DIR = path.join(global.process.cwd(), 'test')

			it('no options - loads all .js files to depth 1 (=specified dir only)', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR)
				sinon.assert.calledTwice(refMapAdd)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTest', require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js')), undefined)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTestTest', require('../test/naming-test.test'), path.join(TEST_FILES_DIR, 'naming-test.test.js')), undefined)
			})

			it('options.dirSearchDepth - -1 loads all .js files recursively', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {dirSearchDepth: -1})
				sinon.assert.callCount(refMapAdd, 3)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('nestedNamingTest', require('../test/nested/nested-naming-test'), path.join(TEST_FILES_DIR, 'nested', 'nested-naming-test.js')), undefined)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTest', require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js')), undefined)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTestTest', require('../test/naming-test.test'), path.join(TEST_FILES_DIR, 'naming-test.test.js')), undefined)
			})

			it('options.supportedExtensions - loads all supported extensions (so nodejs require handles them)', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {supportedExtensions: ['.js', '.json']})
				sinon.assert.callCount(refMapAdd, 3)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTestConfig', require('../test/naming-test-config.json'), path.join(TEST_FILES_DIR, 'naming-test-config.json')), undefined)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTest', require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js')), undefined)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTestTest', require('../test/naming-test.test'), path.join(TEST_FILES_DIR, 'naming-test.test.js')), undefined)
			})

			it('options.exclude - loads all files not matching exclude patterns', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {exclude: ['\\.test\\.']})
				sinon.assert.callCount(refMapAdd, 1)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTest', require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js')), undefined)
			})

			it('options.prefix - all dependecy names are camelCase with prefix', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {prefix: 'test-prefixed'})
				sinon.assert.calledTwice(refMapAdd)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('testPrefixedNamingTest', require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js')), undefined)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('testPrefixedNamingTestTest', require('../test/naming-test.test'), path.join(TEST_FILES_DIR, 'naming-test.test.js')), undefined)
			})

			it('options.suffix - all dependecy names are camelCase with suffix', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {suffix: 'with-suffix'})
				sinon.assert.calledTwice(refMapAdd)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTestWithSuffix', require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js')), undefined)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTestTestWithSuffix', require('../test/naming-test.test'), path.join(TEST_FILES_DIR, 'naming-test.test.js')), undefined)
			})

			it('options.tags - loads all .js files with tags', function() {
				const konteiner = new Konteiner()
				const refMapAdd = sinon.stub(konteiner.refMap, 'add')

				konteiner.registerPath(TEST_FILES_DIR, {tags: ['test', 'tag']})
				sinon.assert.calledTwice(refMapAdd)
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTest', require('../test/naming-test'), path.join(TEST_FILES_DIR, 'naming-test.js')), ['test', 'tag'])
				sinon.assert.calledWithExactly(refMapAdd, new Ref('namingTestTest', require('../test/naming-test.test'), path.join(TEST_FILES_DIR, 'naming-test.test.js')), ['test', 'tag'])
			})
		})

		describe('get', function() {
			it('Retrieves, initializes unitialized dependency and provides instance', function() {
				const konteiner = new Konteiner()
				const INSTANCE = {}
				const TEST_REF = new Ref('testDependency', () => {return INSTANCE})
				sinon.stub(TEST_REF, 'initialize').callThrough()
				const refMapGet = sinon.stub(konteiner.refMap, 'get').returns(TEST_REF)

				assert.isFalse(TEST_REF.isInitialized())
				const dependency = konteiner.get('testDependency')

				sinon.assert.calledOnce(refMapGet)
				sinon.assert.calledWithExactly(refMapGet, 'testDependency')
				sinon.assert.calledOnce(TEST_REF.initialize)
				assert.isTrue(TEST_REF.isInitialized())
				assert.strictEqual(dependency, INSTANCE)
			})

			it('Retrieves, does not initialized pre-initialized dependency and provides instance', function() {
				const konteiner = new Konteiner()
				const INSTANCE = {}
				const TEST_REF = new Ref('testDependency', INSTANCE)
				sinon.stub(TEST_REF, 'initialize').callThrough()
				const refMapGet = sinon.stub(konteiner.refMap, 'get').returns(TEST_REF)

				assert.isTrue(TEST_REF.isInitialized())
				const dependency = konteiner.get('testDependency')

				sinon.assert.calledOnce(refMapGet)
				sinon.assert.calledWithExactly(refMapGet, 'testDependency')
				sinon.assert.notCalled(TEST_REF.initialize)
				assert.isTrue(TEST_REF.isInitialized())
				assert.strictEqual(dependency, INSTANCE)
			})
		})

		describe('getByTag', function() {
			it('Retrieves by tag, initializes unitialized dependencies and provides instances', function() {
				const konteiner = new Konteiner()
				const INSTANCE = {}
				const TAG = 'tag'
				const TEST_REF = new Ref('dependencyName', () => {return INSTANCE})
				sinon.stub(TEST_REF, 'initialize').callThrough()
				const refMapGetByTag = sinon.stub(konteiner.refMap, 'getByTag').returns([TEST_REF])

				assert.isFalse(TEST_REF.isInitialized())
				const dependencies = konteiner.getByTag(TAG)

				sinon.assert.calledOnce(refMapGetByTag)
				sinon.assert.calledWithExactly(refMapGetByTag, TAG)
				sinon.assert.calledOnce(TEST_REF.initialize)
				assert.isTrue(TEST_REF.isInitialized())
				assert.deepEqual(dependencies, [INSTANCE])
			})

			it('Retrieves by tag, does not initialize pre-initialized dependencies and provides instances', function() {
				const konteiner = new Konteiner()
				const INSTANCE = {}
				const TAG = 'tag'
				const TEST_REF = new Ref('dependencyName', INSTANCE)
				sinon.stub(TEST_REF, 'initialize').callThrough()
				const refMapGetByTag = sinon.stub(konteiner.refMap, 'getByTag').returns([TEST_REF])

				assert.isTrue(TEST_REF.isInitialized())
				const dependencies = konteiner.getByTag(TAG)

				sinon.assert.calledOnce(refMapGetByTag)
				sinon.assert.calledWithExactly(refMapGetByTag, TAG)
				sinon.assert.notCalled(TEST_REF.initialize)
				assert.isTrue(TEST_REF.isInitialized())
				assert.deepEqual(dependencies, [INSTANCE])
			})
		})

		describe('getDependenciesProvisionStructure', function() {
			it('Only proxies refMap.getProvisionStructure', function() {
				const RESULT = '{result}'
				const konteiner = new Konteiner()
				const getProvisionStructureStub = sinon.stub(konteiner.refMap, 'getProvisionStructure').returns(RESULT)

				const result = konteiner.getDependenciesProvisionStructure()
				assert.strictEqual(result, RESULT)
				sinon.assert.calledOnce(getProvisionStructureStub)
			})
		})

		describe('remove', function() {
			it('Only proxies refMap.remove and provides result', function() {
				const DEP = '{dependency}'
				const RESULT = '{result}'
				const konteiner = new Konteiner()
				const removeStub = sinon.stub(konteiner.refMap, 'remove').returns(RESULT)

				const result = konteiner.remove(DEP)
				assert.strictEqual(result, RESULT)
				sinon.assert.calledOnce(removeStub)
				sinon.assert.calledWithExactly(removeStub, DEP)
			})
		})
	})

})
