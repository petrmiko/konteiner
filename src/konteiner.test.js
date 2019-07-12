const {describe, it} = require('mocha')
const sinon = require('sinon')

const Konteiner = require('./konteiner')

describe('Konteiner', function() {


	it('Arrow function dependency', function() {
		const TEST_MESSAGE = '{testMessage}'
		const LOGGER_FN = sinon.spy()

		const Logger = () => ({
			log: LOGGER_FN,
		})

		const Messenger = (logger) => ({
			/**
			 * @param {string} message
			 */
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
				/**
				 * @param {string} message
				 */
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
				/**
				 * @param {string} message
				 */
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

			/**
			 * @param {string} message
			 */
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
