import {CALLABLE, CONSTRUCTIBLE} from './init-type.js'
import KonteinerAnonymousNoPathDepCreatorError from '../errors/anonymous-dep-no-path-creator-error.js'

/**
 * @template T
 */

export default class Ref {
	/**
	 * @param {import('../konteiner-types.js').DependencyCreator<T>} dependencyCreator
	 * @param {string=} path
	 */
	constructor(dependencyCreator, path) {
		if (!dependencyCreator.name) {
			if (!path) throw new KonteinerAnonymousNoPathDepCreatorError()
			this.name = '{anonymous Fn}'
			this.path = path
		} else {
			this.name = dependencyCreator.name
		}

		this.dependencyCreator = dependencyCreator
		if (path) this.path = path

		this.initialized = false
		this.type =
				(dependencyCreator.prototype && dependencyCreator.prototype.constructor.name) != null
					? CONSTRUCTIBLE
					: CALLABLE
		this.dependenciesRefs = /** @type {Set<Ref>} */ (new Set())
	}

	/**
	 * @param {import('../konteiner.js')} konteiner
	 * @returns {T} dependency instance
	 */
	getInstance(konteiner) {
		if (!this.initialized) {
			this.instance = (() => {
				switch(this.type) {
				case CONSTRUCTIBLE:
					return Reflect.construct(this.dependencyCreator, [konteiner])
				case CALLABLE:
					return this.dependencyCreator.apply(null, [konteiner])
				}
			})()
			this.initialized = true
		}
		return this.instance
	}
}
