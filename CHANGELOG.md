# Changelog
In this file will be described latest changes in Konteiner package.

## Unreleased

## 2.0.0
- Breaking
    - removed static `Konteiner.container` instance creator, use new instead
    - removed `konteiner.load` alias
    - removed support of retrieving dependency by name (=> removal of prefix, suffix options)
    - => dependencies now stored by itself 
        - this keeps data type of dependency
        - require/import class or function creator and use it in dependent files as a key to instance for Konteiner.get
    - dependency creator now receives Konteiner instance as a parameter instead of listing requested dependencies to be provided
    - => each dependency creator must retrieve its dependencies manually
    - getDependencyMap - now provides Map of SimpleRefs, where keys are dependency creators (function/class) and the references run deep - some preprocessing for print out purposes may be required
- Added
    - introduced types support

## 1.1.0
- Renamed package to scope package format `konteiner` -> `@petrmiko/konteiner`

## 1.0.0
- Initial stable release. No know issues at the time.

## 0.3.0
- getDependenciesProvisionStructure -> getDependencyMap
