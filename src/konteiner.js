import fsHelper from './helpers/fs-helper.js'

import Ref from './structures/ref.js' // eslint-disable-line no-unused-vars
import RefMap from './structures/ref-map.js'

import KonteinerCyclicDepError from './errors/cyclic-dep-error.js'
import KonteinerNotRegisteredError from './errors/not-registered-error.js'

/**
 * @typedef {import('./konteiner-types.js').KonteinerOptions} KonteinerOptions
 * @typedef {import('./konteiner-types.js').RegisterOptions} RegisterOptions
 * @typedef {import('./konteiner-types.js').RegisterPathOptions} RegisterPathOptions
 */

export default class Konteiner {

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
	 * @param {import('./konteiner-types.js').DependencyCreator<T>} dependencyCreator
	 * @param {RegisterPathOptions=} options
	 */
	register(dependencyCreator, options = {}) {
		this.refMap.add(dependencyCreator, null, options.tags)
	}

	/**
	 * @param {string} path
	 * @param {RegisterPathOptions=} options
	 */
	async registerPath(path, options = {}) {
		const exclude = options.exclude || options.skipFiles || this.exclude
		const searchDepth = options.dirSearchDepth || this.searchDepth
		const supportedExtensions = options.supportedExtensions || this.supportedExtensions
		const files = fsHelper.getFileListSync(path, {supportedExtensions, searchDepth})

		for (let file of files) {
			if (exclude.length && exclude.some((exclusion) => file.match(exclusion))) continue
			
			const {default: dependencyCreator} = await import(file)
			if (typeof dependencyCreator === 'function') {
				this.refMap.add(dependencyCreator, file, options.tags)
			}
		}
	}

	/**
	 * @template T
	 * @param {import('./konteiner-types.js').DependencyCreator<T>} dependencyCreator
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
	 * @param {import('./konteiner-types.js').DependencyCreator<T>} dependencyCreator
	 * @returns {boolean}
	 */
	remove(dependencyCreator) {
		return this.refMap.remove(dependencyCreator)
	}

	getDependencyMap() {
		return this.refMap.getDependencyMap()
	}
}
