/**
 * @extends Error
 */
class KonteinerNotRegisteredError extends Error {

	/**
	 * @param {string} dependency
	 */
	constructor(dependency) {
		const message = `Dependency "${dependency}" is not registered`
		super(message)
		this.name = this.constructor.name
		Error.captureStackTrace(this, this.constructor)

		this.dependency = dependency
	}
}

module.exports = KonteinerNotRegisteredError
