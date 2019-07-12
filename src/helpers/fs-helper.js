const fs = require('fs')
const path = require('path')

/**
 * @param {string} startPath
 * @param {?Array<string>} acc
 * @returns {Array<string>}
 */
const getFileListSync = (startPath, acc = []) => {
	if (!fs.statSync(startPath).isDirectory()) {
		return [].concat(acc, startPath)
	} else {
		return fs.readdirSync(startPath)
			.reduce((acc, file) => {
				return getFileListSync(path.join(startPath, file), acc)
			}, acc)
	}
}

/**
 * @param {Array<string>} fileList
 * @param {?Array<string|RegExp>} exlusionList
 * @returns {Map<string, string>}
 */
const transformFileListToDependenciesMap = (fileList, exclusionList = []) => {
	return fileList.reduce((acc, fileName) => {
		const baseName = path.basename(fileName)
		if(!exclusionList.some((exclusion) => fileName.match(exclusion))) {
			const noExtensionBaseName = path.parse(baseName).name
			const camelCaseName = noExtensionBaseName.replace(/[ -_]+(.)/g, (match, char) => char.toUpperCase())
			acc.set(camelCaseName, fileName)
		}

		return acc
	}, new Map())
}

module.exports = {
	getFileListSync,
	transformFileListToDependenciesMap,
}
