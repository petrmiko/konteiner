const KonteinerMissingDependenciesError = require('../errors/missing-deps-error')

const COMMON_FN_DEPS_PARSE_REGEX = /function.*?\((.*?)\)/
const ARROW_FN_DEPS_PARSE_REGEX = /\((.*?)\)\W?=>/
const CLASS_FN_DEPS_PARSE_REGEX = /constructor\W?\((.*?)\)/
const JSDOC_RM_REGEX = /\/\*[\s\S]*?\*\//g

const INIT_TYPE = {
	NO_INIT: 'No-init',
	CALLABLE: 'Callable',
	CONSTRUCTIBLE: 'Constructible',
}

/**
 * @property {boolean} initialized
 * @property {string} name
 * @property {string=} path
 * @property {string} type
 */
class SimpleRef {
	/**
	 * @param {Ref} ref
	 */
	constructor(ref) {
		const {name, type, path, initialized} = ref
		Object.assign(this, {name, type, path, initialized})
	}
}


/**
 * @template DependencyInstance
 */
class Ref {

	/**
	 * @param {string} name
	 * @param {DependencyInstance|function(any):DependencyInstance} implementation
	 * @param {string=} path
	 */
	constructor(name, implementation, path) {
		this.name = name
		this.path = path
		this.implementation = implementation
		this.dependenciesRefs = /** @type {Map<string, Ref>} */ (new Map())

		if (typeof implementation === 'function') {
			this.initialized = false
			this.type =
				!!implementation.prototype && implementation.prototype.constructor.name != null
					? INIT_TYPE.CONSTRUCTIBLE
					: INIT_TYPE.CALLABLE

			const implementationString = implementation.toString().replace(JSDOC_RM_REGEX, '')
			const argsMatch = this.type === INIT_TYPE.CALLABLE
				? implementationString.match(ARROW_FN_DEPS_PARSE_REGEX)
				: implementationString.match(COMMON_FN_DEPS_PARSE_REGEX) || implementationString.match(CLASS_FN_DEPS_PARSE_REGEX)
			const argsString = Array.isArray(argsMatch) ? argsMatch[1] : '' // constructor must not be defined explicitly

			this.dependenciesNames = argsString
				.replace(/\s+/g, '')
				.split(',')
				.filter(Boolean)

			this.dependenciesNames.forEach((dependencyName) => this.dependenciesRefs.set(dependencyName, undefined))
		} else {
			this.initialized = true
			this.instance = implementation
			this.type = INIT_TYPE.NO_INIT
			this.dependenciesNames = []
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

		if (missingDependencies.length) {
			throw new KonteinerMissingDependenciesError(missingDependencies)
		}

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
		this.dependenciesNames.forEach((dependencyName) => {
			this.dependenciesRefs.set(dependencyName, dependenciesRefs.get(dependencyName))
		})
	}

	/**
	 * @returns {SimpleRef}
	 */
	simple() {
		return new SimpleRef(this)
	}
}

module.exports = {Ref, SimpleRef}
