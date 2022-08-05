/**
 * @extends Error
 */
export default class KonteinerNotRegisteredTagError extends Error {

	/**
	 * @param {string} tagName
	 */
	constructor(tagName) {
		const message = `No dependency with tag "${tagName}" is registered`
		super(message)
		this.name = this.constructor.name
		Error.captureStackTrace(this, this.constructor)

		this.tag = tagName
	}
}
