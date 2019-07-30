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
 * @template Dependency
 */

/**
 * @template T
 * @typedef {function(...any=): T} Factory
 */

/**
  * @template T
  * @typedef {function(new:T)} Class
  */

class Ref {

	/**
	 * @param {string} name
	 * @param {Factory<Dependency>|Class<Dependency>|Dependency} implementation
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
	 * @returns {Dependency} dependency instance
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
		if (this.initialized) return

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

		this.instance = (() => {
			if (typeof this.implementation !== 'function') return this.implementation // ts check avoid

			switch(this.type) {
			case INIT_TYPE.CONSTRUCTIBLE:
				return Reflect.construct(this.implementation, dependenciesInstances)
			case INIT_TYPE.CALLABLE:
				return this.implementation.apply(null, dependenciesInstances)
			}
		})()
		this.initialized = true
	}

	/**
	 * @returns {boolean}
	 */
	isInitialized() {
		return this.initialized
	}

	/**
	 * @param {Map<string, Ref>} dependenciesRefs
	 */
	updateDependenciesRefs(dependenciesRefs) {
		this.dependenciesNames.forEach((dependencyName) => {
			const ref = dependenciesRefs.get(dependencyName)
			if (ref) this.dependenciesRefs.set(dependencyName, ref)
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