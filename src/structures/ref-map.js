const NO_DEPS = 'no-deps'

const {Ref, SimpleRef} = require('./refs') // eslint-disable-line no-unused-vars
const KonteinerCyclicDepError = require('../errors/cyclic-dep-error')
const KonteinerNotRegisteredError = require('../errors/not-registered-error')

class RefMap {

	constructor() {
		this.refsByName = /** @type {Map<string, Ref>} */ (new Map())
		this.refsByTag = /** @type {Map<string, Array<Ref>>} */ (new Map())
		this.refMap = new Map()
	}

	/**
	 * @param {Ref} ref
	 * @param {Array<string>=} tags
	 */
	add(ref, tags = []) {
		const {name: refName, path} = ref
		const preexistingRef = this.refsByName.get(refName)
		if (preexistingRef) {
			if (preexistingRef.path === path) {
				console.log('Attempt to re-add', preexistingRef.simple(), ', ignoring...')
				return
			} else {
				console.log('Overriding', preexistingRef, 'with', ref)
			}
		}
		const dependenciesNames = ref.getDependenciesNames()

		const pointerNames = dependenciesNames.length ? dependenciesNames : [NO_DEPS]
		pointerNames.forEach((name) => {
			if (!this.refMap.get(name)) this.refMap.set(name, new Set())
			this.refMap.get(name).add(ref.getName())
		})

		this.refsByName.set(refName, ref)
		tags.forEach((tag) => {
			const refsWithTag = this.refsByTag.get(tag)
			if (!refsWithTag) {
				this.refsByTag.set(tag, [ref])
			} else {
				refsWithTag.push(ref)
			}
		})
		this.refsByName.forEach((ref) => ref.updateDependenciesRefs(this.refsByName))
	}

	/**
	 * @param {Array<string>} searchStack
	 */
	checkDependenciesIntegrity(searchStack) {
		const refName = searchStack.pop()
		const ref = this.refsByName.get(refName)

		if (!ref) throw new KonteinerNotRegisteredError(refName)

		const dependenciesNames = ref.getDependenciesNames()
		if (!dependenciesNames.length) return

		if (dependenciesNames.some((dependency) => dependency === refName || searchStack.includes(dependency))) {
			throw new KonteinerCyclicDepError([].concat(...searchStack, refName, dependenciesNames))
		}
		dependenciesNames.forEach((dependency) => {
			this.checkDependenciesIntegrity([...searchStack, refName, dependency])
		})
	}

	/**
	 * @param {string} refName
	 * @returns {Ref}
	 */
	get(refName) {
		this.checkDependenciesIntegrity([refName])
		return this.refsByName.get(refName)
	}

	/**
	 * @param {string} tagName
	 * @returns {Array<Ref>}
	 */
	getByTag(tagName) {
		return this.refsByTag.get(tagName) || []
	}

	/**
	 * @param {string} refName
	 * @returns {boolean}
	 */
	remove(refName) {
		return this.refsByName.delete(refName)
	}

	/**
	 * @returns {Map<SimpleRef, Array<SimpleRef>>}
	 */
	getProvisionStructure() {
		return Array.from(this.refMap.entries()).reduce((acc, [refName, depsNames]) => {
			const ref = this.refsByName.get(refName) && this.refsByName.get(refName).simple()
			acc.set(
				ref,
				depsNames
					? Array.from(depsNames).map((depName) => this.refsByName.get(depName) && this.refsByName.get(depName).simple())
					: []
			)
			return acc
		}, new Map())
	}
}

module.exports = RefMap
