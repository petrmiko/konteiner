/**
 * @typedef {import('../konteiner-types.js').DependencyCreator<any>} DependencyCreator
 */

/**
 * @extends Error
 */
export default class KonteinerNotRegisteredError extends Error {

	/**
	 * @param {DependencyCreator} dependencyCreator
	 */
	constructor(dependencyCreator) {
		const message = `Dependency "${dependencyCreator.name}" is not registered`
		super(message)
		this.name = this.constructor.name
		Error.captureStackTrace(this, this.constructor)

		this.dependencyCreator = dependencyCreator
	}
}
