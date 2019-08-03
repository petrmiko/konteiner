const NO_DEPS = 'no-deps'

const Ref = require('./ref')
const KonteinerCyclicDepError = require('../errors/cyclic-dep-error')
const KonteinerNotRegisteredError = require('../errors/not-registered-error')
const KonteinerNotRegisteredTagError = require('../errors/not-registered-tag-error')

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
				console.log('Attempt to re-add', Ref.toSimpleRef(ref), ', ignoring...')
				return
			} else {
				console.log('Overriding', preexistingRef, 'with', ref)
			}
		}
		if (!this.refMap.get(refName)) this.refMap.set(refName, new Set())
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
		const refsWithTag = this.refsByTag.get(tagName) || []
		if (!refsWithTag.length) throw new KonteinerNotRegisteredTagError(tagName)
		refsWithTag.forEach(ref => this.checkDependenciesIntegrity([ref.getName()]))
		return refsWithTag
	}

	/**
	 * @param {string} refName
	 * @returns {boolean}
	 */
	remove(refName) {
		this.refsByTag.forEach((refs) => {
			const refIndex = refs.findIndex((ref) => ref.getName() === refName)
			if (refIndex >= 0) refs.splice(refIndex, 1)
		})
		return this.refsByName.delete(refName)
	}

	/**
	 * @returns {Map<typeof Ref.toSimpleRef, typeof Ref.toSimpleRef[]>}
	 */
	getProvisionStructure() {
		return Array.from(this.refMap.entries()).reduce((acc, [refName, depsNames]) => {
			const ref = this.refsByName.get(refName) && Ref.toSimpleRef(this.refsByName.get(refName)) || undefined
			acc.set(
				ref,
				depsNames
					? Array.from(depsNames).map((depName) => {
						const ref = this.refsByName.get(depName)
						return ref
							? Ref.toSimpleRef(ref)
							: undefined
					}).filter(Boolean)
					: []
			)
			return acc
		}, new Map())
	}
}

module.exports = RefMap
