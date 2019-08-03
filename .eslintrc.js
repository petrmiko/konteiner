module.exports = {
	'env': {
		'browser': true,
		'commonjs': true,
		'es6': true
	},
	'extends': [
		'eslint:recommended',
	],
	'globals': {
		'Atomics': 'readonly',
		'SharedArrayBuffer': 'readonly'
	},
	'parserOptions': {
		'ecmaVersion': 2018
	},
	'rules': {
		'eol-last': ['error', 'always'],
		'indent': [ 'error', 'tab' ],
		'linebreak-style': [ 'error', 'unix' ],
		'no-trailing-spaces': ['error'],
		'prefer-const': 'error',
		'quotes': [ 'error', 'single' ],
		'semi': [ 'error', 'never' ],
		'space-before-function-paren': ['error', 'never']
	}
}