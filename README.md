# konteiner - simple zero-dependencies DI container for node.js apps

[![Build Status](https://travis-ci.com/petrmiko/konteiner.svg?branch=master)](https://travis-ci.com/petrmiko/konteiner)
[![Coverage Status](https://coveralls.io/repos/github/petrmiko/konteiner/badge.svg)](https://coveralls.io/github/petrmiko/konteiner)

This module provides you means to:
- register desired instantiable modules (functions, classes) to DI container
- use the initialized dependencies in modules by obtaining them via getter on Konteiner instance, that is provided via constructor/parent function
- having the modules initialized in lazy manner, ie. on first konteiner.get call

## Usage

- Install the dependency
	`npm i --save @petrmiko/konteiner@latest`
- In JS code
```
import Konteiner from '@petrmiko/konteiner'

const konteiner = new Konteiner()

// first we need to have some instance creators, here functions
const Logger = () => console
const Messenger = /** @type {Konteiner} */ (konteiner) => {
	const logger = konteiner.get(Logger)
	return {
		sendMessage(text) { logger.log(text) }
	}
}
// following lines will just register dependencies, init is made upon first get for affected dependencies
konteiner.register(Logger)
konteiner.register(Messenger)

const messenger = konteiner.get(Messenger) // this will actually invoke the constructor of Messenger (and Logger, since it is a dependency of demoMessenger)
messenger.sendMessage('Hello world!') // console.log will print out 'Hello world!'
```

If you want to load all dependencies in an directory, you can also do following.
```
import Konteiner from '@petrmiko/konteiner'
const konteiner = new Konteiner({exclude: [
	'\\.test\\.' // all test files will be omitted from batch loading using .registerPath
]})

konteiner.registerPath('./src', {exclude: [
	'\\.test\\.',
	'index\\.js'
]}) // all but tests and index.js will be loaded. Overrides exclude from constructor for this call only

// then in place of use we need to know, what dependency creator was used to retrieve its instance
import Service from './src/service'

const someService = konteiner.get(Service) // all dependencies bound to Service will be now initialized
...
```

For more details, see [API section](./docs/api.md).
