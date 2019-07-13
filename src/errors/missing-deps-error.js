class KonteinerMissingDependenciesError extends Error {

	/**
	 * @param {Array<string>} dependencies
	 */
	constructor(dependencies) {
		const message = `Missing dependencies! [${
			dependencies
				.map(d => `"${d}"`)
				.join(',')
		}]`
		super(message)
		this.name = this.constructor.name
		Error.captureStackTrace(this, this.constructor)

		this.dependencies = dependencies
	}
}

module.exports = KonteinerMissingDependenciesError
