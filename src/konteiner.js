const fsHelper = require('./helpers/fs-helper')
const formatHelper = require('./helpers/format-helper')

const Ref = require('./structures/ref')
const RefMap = require('./structures/ref-map')

/**
 * @typedef RegisterPathOptions
 * @property {[Array<string>]} exclude excludes files during  call by pattern
 * @property {[number]} dirSearchDepth how deep in subdirectories will Konteiner search for dependencies
 * 	1 = only current (default), -1 = all the way down
 * @property {[Array<string>]} supportedAutofixExtensions when providing file name w/o extension, Konteiner will search for variant with provided extension
 * @property {[string]} prefix string to prefix loaded dependecies names
 * @property {[string]} suffix string to suffix loaded dependecies names
 */

/**
  * @typedef KonteinerOptions
  * @property {[Array<string>]} exclude .registerPath config - excludes files during  call by pattern
  * @property {[number]} dirSearchDepth .registerPath config - how deep in subdirectories will Konteiner search for dependencies
  * 	1 = only current (default), -1 = all the way down
  * @property {[Array<string>]} supportedAutofixExtensions .registerPath config - when providing file name w/o extension, Konteiner will search for variant with provided extension
  */

class Konteiner {

	static container() {return new Konteiner(...arguments)}

	/**
	 * @param {[KonteinerOptions]} options
	 */
	constructor(options = {}) {
		this.refMap = new RefMap()

		this.exclude = options.exclude || options.skipFiles || []
		this.searchDepth = options.dirSearchDepth || 1
		this.supportedAutofixExtensions = options.supportedAutofixExtensions || ['.js']

		this.refMap.add(new Ref('container', () => this))
		this.refMap.add(new Ref('konteiner', () => this))

		//aliases
		this.load = this.registerPath
	}

	/**
	 * @param {string} depName dependency name
	 * @param {any} implementation
	 * @param {?RegisterPathOptions} options
	 */
	register(depName, implementation, options = {}) {
		const {prefix, suffix, tags} = options
		const usedDepName = formatHelper.toCamelCase(`${prefix && prefix + '-' || ''}${depName}${suffix && '-' + suffix || ''}`)
		this.refMap.add(new Ref(usedDepName, implementation), tags)
	}

	/**
	 * @param {string} path
	 * @param {?RegisterPathOptions} options
	 */
	registerPath(path, options = {}) {
		const exclude = options.exclude || options.skipFiles || this.exclude
		const searchDepth = options.dirSearchDepth || this.searchDepth
		const supportedAutofixExtensions = options.supportedAutofixExtensions || this.supportedAutofixExtensions
		const files = fsHelper.getFileListSync(path, [], {supportedAutofixExtensions, searchDepth})
		const filesMap = fsHelper.transformFileListToDependenciesMap(files, exclude)

		filesMap.forEach((path, depName) => {
			const {prefix, suffix, tags} = options
			const usedDepName = formatHelper.toCamelCase(`${prefix && prefix + '-' || ''}${depName}${suffix && '-' + suffix || ''}`)
			this.refMap.add(new Ref(usedDepName, require(path), path), tags)
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
	 * @param {string} tagName
	 * @returns {any[]}
	 */
	getByTag(tagName) {
		const refs = this.refMap.getByTag(tagName)
		refs.map((ref) => {
			if (!ref.isInitialized()) ref.initialize()
			return ref.getInstance()
		})

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
