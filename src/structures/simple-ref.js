module.exports = class SimpleRef {
	/**
	 * @param {import('./ref')} ref
	 */
	constructor(ref) {
		this.name = ref.name
		this.type = ref.type
		this.path = ref.path
		this.initialized = ref.initialized
		this.instance = ref.instance
		this.dependencies = Array.from(
			ref.dependenciesRefs,
			(nestedRef) => new SimpleRef(nestedRef)
		)
	}
}
