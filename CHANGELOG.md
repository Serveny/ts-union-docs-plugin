# Changelog

## [0.3.4]

- **Fixed** Stale Quick Info, completions and diagnostics after edits (caches are now invalidated before reading)
- **Fixed** Stack overflow on recursive type aliases (e.g. `type Json = string | Json[]`)
- **Fixed** Unescaped literal text after `${number}`, `${boolean}` and `${string}` in template literal patterns
- **Fixed** Empty Quick Info popup inside calls without union parameters
- **Fixed** Missing union member docs in files with CRLF line endings
- **Improved** Performance of JSDoc lookup and union member matching
- **Changed** Refactored type info resolution and removed dead code
- **Maintenance** Updated dev dependencies 
- **Tests** Added regression tests for recursive types, template escaping and cache invalidation

## [0.3.3]

- **Fixed** Missing newline at param rendering
- **Fixed** Fix cache miss at files without deprecated functions

## [0.3.2]

- **Fixed** Completion inference for generic parameter constraints
- **Fixed** Constructor union docs and generic completions

## [0.3.1]

- **Fixed** Quick Info Markdown line breaks

## [0.3.0]

- **Added** Deprecated union member diagnostics and completion coverage for deprecated members
- **Improved Quick Info** Refined doc assembly to avoid duplicate non-parameter tags
- **Fixed** Quick Info for union arguments passed through `const` variables
- **Fixed** Quick Info for generic indexed-access union members
- **Tests** Refreshed Mixxx fixtures and expanded Quick Info, completion, and diagnostic coverage

## [0.2.0]

- **Added** Support for constructor union parameter JSDoc
- **Fixed** union traversal for generic type aliases
- **Tests** Added coverage for Mixxx group types and union class properties

## [0.1.0]

- **Enhanced Completions:** Added support for contextual types, snippets, regex spans, and nested union/template types.
- **Robust Testing:** Restructured test suite to cover Mixxx, templates, and union cases.
- **Improved Stability:** Added comprehensive error handling and regex/span bug fixes.
- **Documentation:** Added a completions demo and updated README examples.

## [0.0.2]

- **Improved Tooltips:** Refined Quick Info and JSDoc output to only show relevant, new information.
- **Advanced Type Handling:** Expanded support for recursive/nested union types and template literals.
- **Architecture:** Refactored AST logic and migrated bundling to **Vite**.
- **DX (Dev Experience):** Added a dedicated debug command and expanded documentation.

## [0.0.1]

- **Foundation:** Initial scaffold for `UnionTypeDocsPlugin` and core type info classes.
- **Setup:** Basic documentation, installation guide, and example project.
