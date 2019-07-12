const fsHelper = require('./helpers/fs-helper')

const Ref = require('./structures/ref')
const RefMap = require('./structures/ref-map')

class Konteiner {

	/**
	 * @param {?{exclude?: Array<string>}} options
	 */
	constructor(options = {}) {
		this.refMap = new RefMap()

		this.exclude = options.exclude || options.skipFiles || []
	}

	/**
	 * @param {string} depName dependency name
	 * @param {any} implementation
	 */
	register(depName, implementation) {
		this.refMap.add(new Ref(depName, implementation))
	}

	/**
	 * @param {string} path
	 * @param {?{exclude?: Array<string|RegExp>}} options
	 */
	registerPath(path, options = {}) {
		const exclude = options.exclude || options.skipFiles || this.exclude
		const files = fsHelper.getFileListSync(path)
		const filesMap = fsHelper.transformFileListToDependenciesMap(files, exclude)

		filesMap.forEach((path, dependencyName) => {
			const implementation = require(path)
			this.register(dependencyName, implementation)
		})
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
	 * @typedef {import('./structures/ref').SimpleRef} SimpleRef
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
