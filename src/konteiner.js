const fsHelper = require('./helpers/fs-helper')

const Ref = require('./structures/ref') // eslint-disable-line no-unused-vars
const RefMap = require('./structures/ref-map')

const KonteinerCyclicDepError = require('./errors/cyclic-dep-error')
const KonteinerNotRegisteredError = require('./errors/not-registered-error')

/**
 * @typedef {import('./konteiner-types').KonteinerOptions} KonteinerOptions
 * @typedef {import('./konteiner-types').RegisterOptions} RegisterOptions
 * @typedef {import('./konteiner-types').RegisterPathOptions} RegisterPathOptions
 */

class Konteiner {

	/**
	 * @param {KonteinerOptions=} options
	 */
	constructor(options = {}) {
		this.refMap = new RefMap()

		this.exclude = options.exclude || options.skipFiles || []
		this.searchDepth = options.dirSearchDepth || 1
		this.supportedExtensions = options.supportedExtensions || ['.js']
		this._dependencyQueue = /** @type {Ref[]} */ ([])
	}

	/**
	 * @template T
	 * @param {import('./konteiner-types').DependencyCreator<T>} dependencyCreator
	 * @param {RegisterPathOptions=} options
	 */
	register(dependencyCreator, options = {}) {
		this.refMap.add(dependencyCreator, null, options.tags)
	}

	/**
	 * @param {string} path
	 * @param {RegisterPathOptions=} options
	 */
	registerPath(path, options = {}) {
		const exclude = options.exclude || options.skipFiles || this.exclude
		const searchDepth = options.dirSearchDepth || this.searchDepth
		const supportedExtensions = options.supportedExtensions || this.supportedExtensions
		const files = fsHelper.getFileListSync(path, {supportedExtensions, searchDepth})

		files
			.filter((path) => !(exclude.length && exclude.some((exclusion) => path.match(exclusion))))
			.map((path) => [path, require(path)])
			.filter(([, dependencyCreator]) => typeof dependencyCreator === 'function')
			.forEach(([path, dependencyCreator]) => {
				this.refMap.add(dependencyCreator, path, options.tags)
			})
	}

	/**
	 * @template T
	 * @param {import('./konteiner-types').DependencyCreator<T>} dependencyCreator
	 * @returns {T}
	 */
	get(dependencyCreator) {
		const ref = this.refMap.get(dependencyCreator)
		if (!ref) throw new KonteinerNotRegisteredError(dependencyCreator)
		const dependencyQueue = this._dependencyQueue
		const requestedDependencyQueue = dependencyQueue.concat(ref)
		if (dependencyQueue.includes(ref)) throw new KonteinerCyclicDepError(requestedDependencyQueue.map((ref) => ref.name))
		if (this._dependencyQueue.length > 0) {
			const dependentRef = this._dependencyQueue[this._dependencyQueue.length - 1]
			dependentRef.dependenciesRefs.add(ref)
		}

		return ref.getInstance(Object.assign(Object.create(Object.getPrototypeOf(this)), this, {_dependencyQueue: requestedDependencyQueue}))
	}

	/**
	 * @param {string} tagName
	 * @returns {any[]}
	 */
	getByTag(tagName) {
		const refs = this.refMap.getByTag(tagName)
		return refs.map((ref) => this.get(ref.dependencyCreator))
	}

	/**
	 * @template T
	 * @param {import('./konteiner-types').DependencyCreator<T>} dependencyCreator
	 * @returns {boolean}
	 */
	remove(dependencyCreator) {
		return this.refMap.remove(dependencyCreator)
	}

	getDependencyMap() {
		return this.refMap.getDependencyMap()
	}
}

module.exports = Konteiner
