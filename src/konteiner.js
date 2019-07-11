const Ref = require('./structures/ref')

class Konteiner {

	constructor() {
		this.refs = /** @type {Map<string, Ref>} */ (new Map())
	}

	/**
	 * // TODO petr.miko fix this really naive implementation, add cyclic dependency detection
	 * 
	 * @param {Ref} ref
	 * @returns {void}
	 */
	ensureRefInitialized(ref) {
		if (ref.isInitialized()) return

		const dependeciesRefs = ref.getDependenciesNames()
			.map((depName) => {
				const ref = this.refs.get(depName)
				if (!ref) throw new Error(`Dependency "${depName}" is not registered`)
				return ref
			})
			
		dependeciesRefs
			.filter((ref) => !ref.isInitialized())
			.forEach((ref) => this.ensureRefInitialized(ref))

		ref.initialize(this.refs)
	}

	/**
	 * @param {string} depName dependency name 
	 * @param {Function} implementation 
	 */
	register(depName, implementation) {
		this.refs.set(depName, new Ref(implementation))
	}

	/**
	 * @param {string} depName 
	 */
	get(depName) {
		const ref = this.refs.get(depName)
		if (!ref) throw new Error(`Dependency "${depName}" is not registered`)
		this.ensureRefInitialized(ref)
		return ref.getInstance()
	}
}

module.exports = Konteiner
