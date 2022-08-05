import {describe, it, before, after} from 'mocha'
import {assert} from 'chai'
import mockFs from 'mock-fs'
import path from 'node:path'

import fsHelper from './fs-helper.js'

describe('FS Helper', function() {

	describe('getFileListSync', function() {
		before(function() {
			mockFs({
				'root': {
					'dirA': {
						'a.js': '() => "a"',
						'a-config.json': '{"a": 1}',
					},
					'dirB': {
						'b.js': '() => "b"',
						'b-config.json': '{"b": 2}',
					},
					'root.js': '() => "root"',
					'root-config.json': '{"root": 0}',
				},
			})
		})

		after(function() {
			mockFs.restore()
		})

		describe('By dir name', function() {
			it('Without supported extensions provides nothing', function() {
				assert.isEmpty(fsHelper.getFileListSync('root'))
			})

			it('JS - searchDepth default - all the way down the file tree', function() {
				assert.sameMembers(
					fsHelper.getFileListSync('root', {supportedExtensions: ['.js']}),
					[
						path.join('root', 'root.js'),
						path.join('root', 'dirA', 'a.js'),
						path.join('root', 'dirB', 'b.js'),
					]
				)
			})

			it('JS - searchDepth 1 - provided dir only', function() {
				assert.sameMembers(
					fsHelper.getFileListSync('root', {supportedExtensions: ['.js'], searchDepth: 1}),
					[
						path.join('root', 'root.js'),
					]
				)
			})

			it('JS, JSON - searchDepth default - all the way down the file tree', function() {
				assert.sameMembers(
					fsHelper.getFileListSync('root', {supportedExtensions: ['.js', '.json']}),
					[
						path.join('root', 'root.js'),
						path.join('root', 'root-config.json'),
						path.join('root', 'dirA', 'a.js'),
						path.join('root', 'dirA', 'a-config.json'),
						path.join('root', 'dirB', 'b.js'),
						path.join('root', 'dirB', 'b-config.json'),
					]
				)
			})

			it('JS, JSON - searchDepth 1 - provided dir only', function() {
				assert.sameMembers(
					fsHelper.getFileListSync('root', {supportedExtensions: ['.js', '.json'], searchDepth: 1}),
					[
						path.join('root', 'root.js'),
						path.join('root', 'root-config.json'),
					]
				)
			})
		})


		describe('By file name', function() {
			it('Without supported extensions provides nothing', function() {
				assert.isEmpty(fsHelper.getFileListSync(path.join('root', 'root.js')))
			})

			it('Precise name', function() {
				assert.sameMembers(fsHelper.getFileListSync(path.join('root', 'root.js'), {supportedExtensions: ['.js']}), [path.join('root', 'root.js')])
			})

			it('Precise name - unsupported extension', function() {
				assert.isEmpty(fsHelper.getFileListSync(path.join('root', 'root-config.json'), {supportedExtensions: ['.js']}))
			})

			it('Name wo/ suffix - JS', function() {
				assert.sameMembers(fsHelper.getFileListSync(path.join('root', 'root'), {supportedExtensions: ['.js']}), [path.join('root', 'root.js')])
			})

			it('Name wo/ suffix - JSON', function() {
				assert.sameMembers(fsHelper.getFileListSync(path.join('root', 'root-config'), {supportedExtensions: ['.js', '.json']}), [path.join('root', 'root-config.json')])
			})

			it('Name wo/ suffix - unsupported extension', function() {
				assert.isEmpty(fsHelper.getFileListSync(path.join('root', 'root-config'), {supportedExtensions: ['.js']}))
			})
		})

	})
})
