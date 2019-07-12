const NO_DEPS = 'no-deps'

/**
 * @typedef {import('./ref')} Ref 
 */

class RefMap {

	constructor() {
		this.refs = /** @type {Map<string, Ref>} */ (new Map())
		this.refMap = new Map()
	}

	/**
	 * @param {Ref} ref 
	 */
	add(ref) {
		const dependenciesNames = ref.getDependenciesNames()

		const pointerNames = dependenciesNames.length ? dependenciesNames : [NO_DEPS]
		pointerNames.forEach((name) => {
			if (!this.refMap.get(name)) this.refMap.set(name, new Set())
			this.refMap.get(name).add(ref.getName())
		})

		ref.updateDependenciesRefs(this.refs)
		this.refs.set(ref.getName(), ref)
	}

	/**
	 * @param {string[]} searchStack 
	 */
	checkDependenciesIntegrity(searchStack) {
		const refName = searchStack.pop()
		const ref = this.refs.get(refName)
		
		if (!ref) throw new Error(`Dependency "${refName}" is not registered`)

		const dependenciesNames = ref.getDependenciesNames()
		if (!dependenciesNames.length) return

		if (dependenciesNames.some((dependency) => dependency === refName || searchStack.includes(dependency))) {
			throw new Error(`Cyclic dependency found! [${[...searchStack, refName, dependenciesNames].join('->')}]`)
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
		return this.refs.get(refName)
	}

	/**
	 * @param {string} refName
	 * @returns {boolean}
	 */
	remove(refName) {
		return this.refs.delete(refName)
	}

	getProvisionStructure() {
		return Array.from(this.refMap.entries()).reduce((acc, [refName, depsNames]) => {
			const ref = this.refs.get(refName) && this.refs.get(refName).simple()
			acc.set(
				ref, 
				depsNames
					? Array.from(depsNames).map((depName) => this.refs.get(depName) && this.refs.get(depName).simple())
					: []
			)
			return acc
		}, new Map())
	}
}

module.exports = RefMap
