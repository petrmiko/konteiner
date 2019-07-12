const Ref = require('./structures/ref')
const RefMap = require('./structures/ref-map')

class Konteiner {

	constructor() {
		this.refMap = new RefMap()
	}

	/**
	 * @param {string} depName dependency name 
	 * @param {Function} implementation 
	 */
	register(depName, implementation) {
		this.refMap.add(new Ref(depName, implementation))
	}

	/**
	 * @param {string} depName 
	 */
	get(depName) {
		const ref = this.refMap.get(depName)
		if (!ref.isInitialized()) ref.initialize()
		return ref.getInstance()
	}

	/**
	 * @typedef {{name: string, type: string, initialized: string}} SimpleRef
	 * @returns {Map<SimpleRef, SimpleRef[]}
	 */
	getDependenciesProvisionStructure() {
		return this.refMap.getProvisionStructure()
	}

	/**
	 * @param {string} depName
	 * @returns {boolean}
	 */
	remove(depName) {
		return this.refMap.remove(depName)
	}
}

module.exports = Konteiner
