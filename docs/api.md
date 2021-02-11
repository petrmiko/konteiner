# API

Konteiner is implemented as a class providing following API.
- all dependencies are stored/retrieved by name of its class or function creator, i.e. 'function testDependency() {}' => 'testDependency'
- function dependencies factories are invoked upon first `.get` method call, ie. lazy initialization

## Methods

### constructor([options])
- new instance of Konteiner
- `options` optional Object
	- `exclude` (alias `skipFiles`) - optional string[]
		- _sets default for `.registerPath`_
		- when registering dependency, files can be excluded by matching pattern over the path.
	- `dirSearchDepth` - optional number
		- _sets default for `.registerPath`_ 
		- maximum dir depth to search for dependencies
			- `1` (default) - only specified directory
			- `>0` - registers whole subtree
	- `supportedExtensions` - optional string[]
		- _sets default for `.registerPath`_
		- if provided path is not found, provided extensions will be appended and tested
			- `['.js']` (default)

### register (dependencyCreator, [options])
- Registers dependency factory (if function/class) or dependency

- `dependencyCreator` - class or function
	- if function - stored as uninitialized, instance will be initialized upon `.get`
	- otherwise - stored as initialized, provided as-is
- `option` - optional Object
	- `tags` - optional string[]
		- dependency will be stored with given tag for retrieval using `.getByTag`

### registerPath (path, [options])
- Loads dependencies from filesystem
- Some options may have set defaults using constructor

- `path` - string
	- path to load
	- if file `options.supportedExtensions` may apply
	- if directory `options.dirSearchDepth` may apply
- `options` - optional Object
	- `exclude` (alias `skipFiles`) - optional string[]
		- when registering dependency, files can be excluded by matching pattern over the path.
		- _usage overrides default from constructor_
	- `dirSearchDepth` - optional number
		- maximum dir depth to search for dependencies
			- `1` (default) - only specified directory
			- `>0` - registers whole subtree
		- _usage overrides default from constructor_
	- `supportedExtensions` - optional string[]
		- if provided path is not found, provided extensions will be appended and tested
			- `['.js']` (default)
		- _usage overrides default from constructor_
	- `tags` - optional string[]
		- dependency will be stored with given tag for retrieval using `.getByTag`

### get (dependencyCreator)
- retrieves dependency
- initializes if applicable
- provides initialized instance

### getByTag (tagName)
- retrieves dependencies with tag
- initializes if applicable
- provides initialized instances

### remove (dependencyCreator)

### getDependencyMap ()
Provides Map<dependencyCreator, SimpleRef>, that can be used to custom investigation of dependencies, or printing out dependencies map after some post processing.

- key - dependencyCreator - dependency creator which is provided
- value - SimpleRef wrapping information about given creator and its dependencies

## Structures

### Ref
- `name` - string - dependencyCreator name, `{anonymous Fn}` if anonymous
- `path` - string - from while file was dependency loaded (if applicable)
- `type` - string - `Callable` or `Constructible`
- `initialized` - boolean - `.initialized`
- `dependencyCreator` - creator for initializing dependency instance
- `instance` - any - set once initialized, `.getInstance()`
- `dependenciesRefs` - Set<Ref> - set of references to used dependencies

### SimpleRef
- Ref can be converted to SimpleRef via `new SimpleRef(ref)`
- `name` - string - dependency name retrieved from dependencyCreator
- `path` - string - from while file was dependencyloaded (if applicable)
- `type` - string - `Callable` or `Constructible`
- `initialized` - boolean
- `instance` - any - set once initialized, `.getInstance()`
- `dependencies` - Array<SimpleRef> - array of simple references to used dependencies

## Errors

### KonteinerAnonymousNoPathDepCreatorError
- user attempted to register anonymous function directly (not done via registerPath)
- this scenario does not make sense, since there would be no way to retrieve 
	- `message` - string - "Anonymous dependencies wo/path not supported - now way of retrieving them"

### KonteinerNotRegisteredError
- attempted get operation for not registered dependency
	- `message` - string - e.g. 'Dependency "dependencyName" is not registered'
	- `dependencyCreator` - any - item by which was attempted the get instance operation

### KonteinerNotRegisteredTagError
- attempted get operation for tag not used in any register operation
	- `message` - string - e.g. 'No dependency with tag "routes" is registered'
	- `tag` - any - tag used for get by tag operation

### KonteinerCyclicDepError
- during initialization of dependency found dependency loop
	- `message` - string - e.g. 'Cyclic dependency found! ["dependencyA"->"dependencyB"->"dependencyA"]'
	- `dependencies` - string[] - e.g. ["dependencyA", "dependencyB", "dependencyA"]
