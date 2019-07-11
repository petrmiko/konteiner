
const DEPS_PARSE_REGEX = /\((.*?)\)/

const TYPE = {
	OBJECT: 'Object',
	FUNCTION: 'Function',
	CLASS: 'Class',
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

		if (typeof implementation === 'object') {
			this.initialized = true
			this.instance = implementation
			this.type = TYPE.OBJECT
		} else {
			this.initialized = false
			this.type = 
				!!implementation.prototype && implementation.prototype.constructor.name != null
					? TYPE.CLASS
					: TYPE.FUNCTION

			const implementationString = implementation.toString()
			const argsMatch = implementationString.match(DEPS_PARSE_REGEX)
			const argsString = argsMatch[1]

			this.dependenciesNames = argsString
				.replace(/\s+/, '')
				.split(',')
				.filter(Boolean)
		}
	}

	/**
	 * @returns {Array<string>}
	 */
	getDependenciesNames() {
		return this.dependenciesNames
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
				acc.set(depName, dependenciesRefs.get(depName).getInstance())
				return acc
			}, new Map())

		const missingDependencies = Array.from(usedDependencies.entries())
			.filter(([, dependency]) => dependency == null)

		if (missingDependencies.length) throw new Error(`Missing dependencies! ${JSON.stringify(missingDependencies)}`)

		this.instance = this.type === TYPE.CLASS
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