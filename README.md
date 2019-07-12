![Latest version](https://badgen.net/npm/v/konteiner)
![Install size](https://badgen.net/packagephobia/install/konteiner)
![Dependencies](https://badgen.net/david/dep/petrmiko/konteiner)

# konteiner - simple zero-dependencies DI container for node.js apps

This module provides you means to:
- register desired modules (objects, functions, classes) to DI container
- use the initialized dependencies in modules by obtaining them from constructor/parent function
- having the modules initialized in lazy manner, ie. on first konteiner.get call

## Usage

- Install the dependency
	npm i --save konteiner@latest
- In JS code
```
const Konteiner = require('konteiner')

const konteiner = new Konteiner()
// following lines will just register dependencies, init is made upon first get for affected dependencies
konteiner.register('logger', () => console)
konteiner.register('demoMessenger', (logger) => {
	return {
		sendMessage(text) { logger.log(text) }
	}
})

const messenger = konteiner.get('demoMessenger') // this will actually invoke the constructor of demoMessenger (and logger, since it is a dependency of demoMessenger)
messenger.sendMessage('Hello world!') // console.log will print out 'Hello world!'
```

## Notes
This is an alpha version - there might be and probably are bugs, despite the few tests written.