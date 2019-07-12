const fs = require('fs')
const path = require('path')

const {toCamelCase} = require('./format-helper')

/**
 * @param {string} startPath
 * @param {?Array<string>} acc
 * @param {{
 * 	searchDepth: number,
 * 	supportedAutofixExtensions?: Array<string>,
 * }} config
 * @returns {Array<string>}
 */
const getFileListSync = (startPath, acc = [], config = {}, currentDepth = 1) => {
	const {supportedAutofixExtensions = [], searchDepth = -1} = config
	let saneStartPath = startPath
	if (!fs.existsSync(startPath)) {
		supportedAutofixExtensions.forEach((supportedAppendSuffix) => {
			const tmpPath =  startPath + supportedAppendSuffix
			if(fs.existsSync(tmpPath)) {
				saneStartPath = tmpPath
				return
			}
		})
	}
	if (!fs.statSync(saneStartPath).isDirectory()) {
		return [].concat(acc, saneStartPath)
	} else {
		if (searchDepth > 0 && searchDepth < currentDepth) return acc
		return fs.readdirSync(saneStartPath)
			.reduce((acc, file) => {
				return getFileListSync(path.join(saneStartPath, file), acc, config, currentDepth + 1)
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
			const camelCaseName = toCamelCase(noExtensionBaseName)
			acc.set(camelCaseName, fileName)
		}

		return acc
	}, new Map())
}

module.exports = {
	getFileListSync,
	transformFileListToDependenciesMap,
	toCamelCase,
}
