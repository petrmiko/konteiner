/**
 * @param {string} text
 */
const toCamelCase = (text) => text.replace(/[\s-_\\.]+(.)/g, (match, char) => char.toUpperCase())

module.exports = {
	toCamelCase,
}
