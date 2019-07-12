
const DEPS_PARSE_REGEX = /\((.*?)\)/

const INIT_TYPE = {
	NO_INIT: 'No-init',
	CALLABLE: 'Callable',
	CONSTRUCTIBLE: 'Constructible',
}

/**
 * @template DependencyInstance
 */
/**
 * @typedef {{name: string, type: string, initialized: boolean}} SimpleRef
 */
module.exports = class Ref {

	/**
	 * @param {string} name
	 * @param {DependencyInstance|function(any...):DependencyInstance} implementation
	 */
	constructor(name, implementation) {
		this.name = name
		this.implementation = implementation
		this.dependenciesRefs = /** @type {Map<string, Ref>} */ (new Map())

		if (typeof implementation === 'function') {
			this.initialized = false
			this.type =
				!!implementation.prototype && implementation.prototype.constructor.name != null
					? INIT_TYPE.CONSTRUCTIBLE
					: INIT_TYPE.CALLABLE

			const implementationString = implementation.toString()
			const argsMatch = implementationString.match(DEPS_PARSE_REGEX)
			const argsString = Array.isArray(argsMatch) ? argsMatch[1] : '' // constructor must not be defined explicitly

			argsString
				.replace(/\s+/g, '')
				.split(',')
				.filter(Boolean)
				.forEach((dependencyName) => this.dependenciesRefs.set(dependencyName, undefined))
		} else {
			this.initialized = true
			this.instance = implementation
			this.type = INIT_TYPE.NO_INIT
		}
	}

	/**
	 * @returns {Array<string>}
	 */
	getDependenciesNames() {
		return Array.from(this.dependenciesRefs.keys())
	}

	/**
	 * @returns {DependencyInstance}
	 */
	getInstance() {
		return this.instance
	}

	/**
	 * @returns {string}
	 */
	getName() {
		return this.name
	}

	/**
	 * @returns {void}
	 */
	initialize() {
		if (this.instance) return this.instance

		const missingDependencies = Array.from(this.dependenciesRefs.entries())
			.filter(([, ref]) => ref == null)
			.map(([dependencyName]) => dependencyName)

		if (missingDependencies.length) throw new Error(`Missing dependencies! ${JSON.stringify(missingDependencies)}`)

		this.dependenciesRefs.forEach((ref) => {
			if (!ref.isInitialized()) ref.initialize()
		})

		const dependenciesInstances = Array.from(this.dependenciesRefs.values())
			.map((ref) => ref.getInstance())

		this.instance = this.type === INIT_TYPE.CONSTRUCTIBLE
			? new this.implementation(...dependenciesInstances)
			: this.implementation(...dependenciesInstances)
		this.initialized = true
	}

	/**
	 * @returns {boolean}
	 */
	isInitialized() {
		return this.initialized
	}

	/**
	 * @param {Map<string, DependencyInstance>} dependenciesRefs
	 */
	updateDependenciesRefs(dependenciesRefs) {
		this.dependenciesRefs.forEach((_, dependencyName) => {
			this.dependenciesRefs.set(dependencyName, dependenciesRefs.get(dependencyName))
		})
	}

	/**
	 * @returns {SimpleRef}
	 */
	simple() {
		const {name, type, initialized} = this
		return {name, type, initialized}
	}
}
