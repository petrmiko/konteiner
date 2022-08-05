import Ref from './ref.js'
import KonteinerNotRegisteredTagError from '../errors/not-registered-tag-error.js'
import SimpleRef from './simple-ref.js'

export default class RefMap {

	constructor() {
		this.refsByCreator = /** @type {Map<import('../konteiner-types.js').DependencyCreator<any>, Ref>} */ (new Map())
		this.refsByTag = /** @type {Map<string, Array<Ref>>} */ (new Map())
	}

	/**
	 * @template T
	 * @param {import('../konteiner-types.js').DependencyCreator<T>} dependencyCreator
	 * @param {string} [path]
	 * @param {Array<string>} [tags]
	 */
	add(dependencyCreator, path, tags = []) {
		const preexistingRef = this.refsByCreator.get(dependencyCreator)

		if (preexistingRef && preexistingRef.path === path) {
			console.log('Attempt to re-add', new SimpleRef(preexistingRef), ', ignoring...')
			return
		}
		const ref = new Ref(dependencyCreator, path)
		if (preexistingRef) {
			console.log('Overriding', new SimpleRef(preexistingRef), 'with', new SimpleRef(ref))
		}

		this.refsByCreator.set(dependencyCreator, ref)
		tags.forEach((tag) => {
			const refsWithTag = this.refsByTag.get(tag)
			if (!refsWithTag) {
				this.refsByTag.set(tag, [ref])
			} else {
				refsWithTag.push(ref)
			}
		})
	}

	/**
	 * @template T
	 * @param {import('../konteiner-types.js').DependencyCreator<T>} dependencyCreator
	 * @returns {Ref<T>}
	 */
	get(dependencyCreator) {
		return this.refsByCreator.get(dependencyCreator)
	}

	/**
	 * @param {string} tagName
	 * @returns {Array<Ref>}
	 */
	getByTag(tagName) {
		const refsWithTag = this.refsByTag.get(tagName) || []
		if (!refsWithTag.length) throw new KonteinerNotRegisteredTagError(tagName)
		return refsWithTag
	}

	/**
	 * @template T
	 * @param {import('../konteiner-types.js').DependencyCreator<T>} dependencyCreator
	 * @returns {boolean}
	 */
	remove(dependencyCreator) {
		const removeRef = (refs) => {
			const refIndex = refs.findIndex((ref) => ref.dependencyCreator === dependencyCreator)
			if (refIndex >= 0) refs.splice(refIndex, 1)
		}
		this.refsByTag.forEach(removeRef)
		return this.refsByCreator.delete(dependencyCreator)
	}

	/**
	 * @returns {Map<any, SimpleRef>}
	 */
	getDependencyMap() {
		return new Map(Array.from(this.refsByCreator.entries(), ([depCreator, ref]) => [
			depCreator,
			new SimpleRef(ref)
		]))
	}
}
