const {describe, it} = require('mocha')
const {assert} = require('chai')

const fsHelper = require('./fs-helper')

describe('FS Helper', function() {
	describe('transformFileListToDependenciesMap', function() {
		it('Transforms file list to map of camelCase base name and path', function() {
			const FILE_LIST = [
				'./src/space dep.js',
				'./src/snake_case_dep.js',
				'./src/kebab_case_dep.js',
				'root_dep.js',
				'./src/config.json',
				'./src/some.test.js',
			]

			const mapping = fsHelper.transformFileListToDependenciesMap(FILE_LIST)
			assert.deepEqual(mapping, new Map([
				['spaceDep', './src/space dep.js'],
				['snakeCaseDep', './src/snake_case_dep.js'],
				['kebabCaseDep', './src/kebab_case_dep.js'],
				['rootDep', 'root_dep.js'],
				['config', './src/config.json'],
				['someTest', './src/some.test.js'],
			]))
		})

		it('Excludes by provided exclusion array of string patterns', function() {
			const FILE_LIST = [
				'./src/space dep.js',
				'./src/snake_case_dep.js',
				'./src/kebab_case_dep.js',
				'root_dep.js',
				'./src/config.json',
				'./src/some.test.js',
			]
			const EXCLUSIONS = [
				'.test.',
				'.json',
				'space dep.js',
			]

			const mapping = fsHelper.transformFileListToDependenciesMap(FILE_LIST, EXCLUSIONS)
			assert.deepEqual(mapping, new Map([
				['snakeCaseDep', './src/snake_case_dep.js'],
				['kebabCaseDep', './src/kebab_case_dep.js'],
				['rootDep', 'root_dep.js'],
			]))
		})
	})
})
