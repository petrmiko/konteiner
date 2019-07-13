# API

Konteiner is implemented as a class providing following API.
- all dependencies are stored/retrieved by camelCase name, i.e. 'test-dependency' => 'testDependency'
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

### static container([options])
- factory for constructor

### register (dependencyName, implementation, [options])
- Registers dependency factory (if function/class) or dependency

- `dependencyName` - string
	- will be transformed to camelCase, prefix/suffix from `options` may apply
- `implementation` - any
	- if function - stored as uninitialized, instance will be initialized upon `.get`
	- otherwise - stored as initialized, provided as-is
- `option` - optional Object
	- `prefix`, `suffix` - string
		- decorates `dependencyName` accordingly, result is camelCase
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
	- `prefix`, `suffix` - string
		- decorates `dependencyName` accordingly, result is camelCase
	- `tags` - optional string[]
		- dependency will be stored with given tag for retrieval using `.getByTag`

### get (dependencyName)
- retrieves dependency
- initializes if applicable
- provides initialized instance

### getByTag (tagName)
- retrieves dependencies with tag
- initializes if applicable
- provides initialized instances

### remove (dependencyName)

### getDependenciesProvisionStructure ()
Provides simple dependency provision structure of SimpleRefs as a Map.

- key - SimpleRef - dependency which is provided
- value - SimpleRef[] - dependants

## Structures

### SimpleRef
- `name` - string - dependency name
- `path` - string - from while file was dependencyloaded (if applicable)
- `initialized` - boolean
- `type` - string - one of `No-init`, `Callable`,`Constructible`

### Ref
- `name` - string - dependency name, `.getName()`
- `path` - string - from while file was dependencyloaded (if applicable)
- `initialized` - boolean - `.isInitialized()`
- `type` - string - one of `No-init`, `Callable`,`Constructible`
- `implementation` - any - provided dependency body(factory fn, object, pritive, ...)
- `instance` - any - set once initialized, `.getInstanc()`
- `dependenciesNames` - string[] - camelCase names ofrequired initialized dependencies instances forinitialization, `.getDependenciesNames()`
- `dependenciesRefs` - Map<string, Ref> - map ofreferences to required dependencies by name

## Errors

### KonteinerNotRegisteredError
- attempted get operation for not registered dependency
	- `message` - string - e.g. 'Dependency "dependencyName" is not registered'
	- `dependency` - string - e.g. "dependencyName"

### KonteinerMissingDependenciesError
- dependencies in error message were not registered and are missing during initialization of a dependency instance
	- `message` - string - e.g. 'Missing dependencies! ["dependencyA","dependencyB"]"
	- `dependencies` - string[] - e.g. ["dependencyA","dependencyB"]

### KonteinerCyclicDepError
- during initialization of dependency found dependency loop
	- `message` - string - e.g. 'Cyclic dependency found! ["dependencyA"->"dependencyB"->"dependencyA"]'
	- `dependencies` - string[] - e.g. ["dependencyA", "dependencyB", "dependencyA"]
