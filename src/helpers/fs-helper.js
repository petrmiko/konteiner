import fs from 'node:fs'
import path from 'node:path'

/**
 * @module FsHelper
 */

/**
  * @typedef FsListConfig
  * @property {number=} searchDepth default -1
  * @property {Array<string>=} supportedExtensions
  */

/**
 * @param {string} startPath
 * @param {FsListConfig=} config
 * @param {Array<string>=} acc
 * @param {number} currentDepth
 * @returns {Array<string>}
 */
const getFileListSync = (startPath, config = {}, acc = [], currentDepth = 1) => {
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
		// no adjustment made -> path really does not exist
		if (saneStartPath === startPath) return acc
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
				return getFileListSync(path.join(saneStartPath, file), config, acc, currentDepth + 1)
			}, acc)
	}
}

export default {
	getFileListSync,
}