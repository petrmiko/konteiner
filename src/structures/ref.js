
const DEPS_PARSE_REGEX = /\((.*?)\)/

const INIT_TYPE = {
	NO_INIT: 'No-init',
	CALLABLE: 'Callable',
	CONSTRUCTIBLE: 'Constructible',
}

/**
 * @template DependencyInstance
 */
module.exports = class Ref {

	/**
	 * @param {DependencyInstance|function(any...):DependencyInstance} implementation 
	 */
	constructor(implementation) {
		this.implementation = implementation

		if (typeof implementation === 'function') {
			this.initialized = false
			this.type = 
				!!implementation.prototype && implementation.prototype.constructor.name != null
					? INIT_TYPE.CONSTRUCTIBLE
					: INIT_TYPE.CALLABLE

			const implementationString = implementation.toString()
			const argsMatch = implementationString.match(DEPS_PARSE_REGEX)
			const argsString = Array.isArray(argsMatch) ? argsMatch[1] : '' // constructor must not be defined explicitly

			this.dependenciesNames = argsString
				.replace(/\s+/g, '')
				.split(',')
				.filter(Boolean)
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
		return this.dependenciesNames || []
	}

	/**
	 * @returns {DependencyInstance}
	 */
	getInstance() {
		return this.instance
	}

	/**
	 * @param {Map<string, DependencyInstance>} dependenciesRefs
	 * @returns {void}
	 */
	initialize(dependenciesRefs) {
		if (this.instance) return this.instance

		const usedDependencies = this.dependenciesNames
			.reduce((acc, depName) => {
				const dependencyRef = dependenciesRefs.get(depName)
				acc.set(depName, dependencyRef && dependencyRef.getInstance())
				return acc
			}, new Map())

		const missingDependencies = Array.from(usedDependencies.entries())
			.filter(([, dependency]) => dependency == null)
			.map(([dependencyName]) => dependencyName)

		if (missingDependencies.length) throw new Error(`Missing dependencies! ${JSON.stringify(missingDependencies)}`)

		this.instance = this.type === INIT_TYPE.CONSTRUCTIBLE
			? new this.implementation(...usedDependencies.values())
			: this.implementation(...usedDependencies.values())
		this.initialized = true
	}

	/**
	 * @returns {boolean}
	 */
	isInitialized() {
		return this.initialized
	}
}