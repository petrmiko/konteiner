const fs = require('fs')
const path = require('path')

const {toCamelCase} = require('./format-helper')

/**
 * @module FsHelper
 */

/**
 * @param {string} startPath
 * @param {Array<string>=} acc
 * @param {Object=} config
 * @param {number=} config.searchDepth default -1
 * @param {Array<string>=} config.supportedExtensions
 * @returns {Array<string>}
 */
const getFileListSync = (startPath, acc = [], config = {}, currentDepth = 1) => {
	const {supportedExtensions = [], searchDepth = -1} = config
	let saneStartPath = startPath
	if (!fs.existsSync(startPath)) {
		supportedExtensions.forEach((supportedAppendSuffix) => {
			const tmpPath =  startPath + supportedAppendSuffix
			if(fs.existsSync(tmpPath)) {
				saneStartPath = tmpPath
				return
			}
		})
	}

	if (!fs.statSync(saneStartPath).isDirectory()) {
		const extension = path.parse(saneStartPath).ext
		if(!supportedExtensions.includes(extension)) {
			return acc
		}
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
 * @param {Array<string>=} exlusionList
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
