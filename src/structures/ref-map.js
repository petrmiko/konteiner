const Ref = require('./ref')
const KonteinerCyclicDepError = require('../errors/cyclic-dep-error')
const KonteinerNotRegisteredError = require('../errors/not-registered-error')
const KonteinerNotRegisteredTagError = require('../errors/not-registered-tag-error')

class RefMap {

	constructor() {
		this.refsByName = /** @type {Map<string, Ref>} */ (new Map())
		this.refsByTag = /** @type {Map<string, Array<Ref>>} */ (new Map())
		this.depsMap = /** @type {Map<string, Array<Ref>>} */ (new Map())
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
				console.log('Overriding', Ref.toSimpleRef(preexistingRef), 'with', Ref.toSimpleRef(ref))
			}
		}

		this.refsByName.set(refName, ref)
		tags.forEach((tag) => {
			const refsWithTag = this.refsByTag.get(tag)
			if (!refsWithTag) {
				this.refsByTag.set(tag, [ref])
			} else {
				refsWithTag.push(ref)
			}
		})

		const dependenciesNames = ref.getDependenciesNames()
		// register for dependencies
		;(dependenciesNames.length ? dependenciesNames : [undefined]).forEach((dependencyName) => {
			if (!this.depsMap.has(dependencyName)) this.depsMap.set(dependencyName, [])
			this.depsMap.get(dependencyName).push(ref)

			// deps insert prior current ref - set dependency
			if (this.refsByName.has(dependencyName)) ref.setDependency(this.refsByName.get(dependencyName))
		})

		// provide dependency
		if (this.depsMap.has(refName)) {
			this.depsMap.get(refName).forEach((dependentRef) => dependentRef.setDependency(ref))
		}
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
		const removeRef = (refs) => {
			const refIndex = refs.findIndex((ref) => ref.getName() === refName)
			if (refIndex >= 0) refs.splice(refIndex, 1)
		}
		this.refsByTag.forEach(removeRef)
		this.depsMap.forEach(removeRef)
		return this.refsByName.delete(refName)
	}

	/**
	 * @returns {Map<typeof Ref.toSimpleRef, typeof Ref.toSimpleRef[]>}
	 */
	getDependencyMap() {
		return Array.from(this.depsMap.entries()).reduce((acc, [refName, dependentRefs]) => {
			const ref = this.refsByName.has(refName) ? Ref.toSimpleRef(this.refsByName.get(refName)) : refName
			acc.set(
				ref,
				dependentRefs.map((ref) => Ref.toSimpleRef(ref))
			)
			return acc
		}, new Map())
	}
}

module.exports = RefMap
