/**
 * @extends Error
 */
class KonteinerAnonymousNoPathDepCreatorError extends Error {

	constructor() {
		super('Anonymous dependencies wo/path not supported - now way of retrieving them')
		Error.captureStackTrace(this, this.constructor)
	}
}

module.exports = KonteinerAnonymousNoPathDepCreatorError
