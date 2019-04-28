# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

Distributed synchronization using Operations Trannsformations

## Status

This ES6 package is a port of the [Go implementation](https://github.com/dotchain/dot) that should fully interoperate with that version.

The roadmap:

1. ~Port minimal dot/changes and dot/changes/types. **Done**~
    * ~This includes encoding/decoding to match [sjson](https://github.com/dotchain/dot/tree/master/ops/sjson).~
    * ~Only the Map type is needed initially as this can produce fairly rich types.~
    * ~Only PathChange, ChangeSet and Replace change type are needed initially.~
2. ~Implement streams interface. This will likely be a bit different than the golang version.~
3. ~Implement operations but only the client-side of it.~
4. ~Implement a browser demo against golang backend.~
5. ~Implement array operations and basic array types.~
6. ~Implement streams for array elements.~
7. ~Implement string JS types.~
8. Implement session with local transformations. **In Progress**
9. Add custom struct and collection type factories.
9. Update demos.
11. Implement JS server version with golang front-end tests for interop.

## Convergent streams

[Convergent streams in Dot.js](convergent.md)

## Installation

There is no plan to make this code available via NPM.  The suggested way to use this library is by adding the following to your package.json and using it.

```
yarn add git://github.com/dotchain/dotjs
```

or

```
npm install git://github.com/dotchain/dotjs
```

## Tests

* Node-based tests: `yarn mocha` or `npm run mocha`.
* Node-based tests with code coverage: `yarn test` or `npm test`.
* Browser tests using Karma: `yarn karma` or `npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Requires golang for running servers (at this point).
    * Run a server via `go run test/e2e/server.go`
    * Run `yarn e2e` or `npm run e2e`

## Demo

The demo is a silly command line app:

* Start the server via `go run demo/server.go` (obviously requires golang)
* Run the client via `node -r esm demo/client.js`

The client currently blocks for 30s on the first call but should print
a message every second after that.

