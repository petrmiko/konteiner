export default class SimpleRef {
	/**
	 * @param {import('./ref.js').default} ref
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
