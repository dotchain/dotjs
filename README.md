# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

The dotjs project provides ES6 support for distributed sychronized reactive functional datastructures.

This includes two packages: a low level [lib](lib/README.md) package and a much higher level [dotdb](db/README.md) package.  Both packages effectively interoperate with each other and the [Go](https://github.com/dotchain/dot) implementation but the [dotdb](db/README.md) approach is easier to use.

## Contents

## Status

The [lib](lib/README.md) package is relatively stable.  The [db](db/README.md) package is still going through some changes.

## Installation

There is no npm support.  Please use the repo link directly:

```sh
yarn add https://github.com/dotchain/dotjs/db
```

A single-file output is available via [dist/dotdb.js](https://github.com/dotchain/dotjs/blob/master/dist/dotdb.js).

## DotDB

DotDB is a functional, convergent, reactive, synchronized store.

### Initializing

```js
// import {Store} from "dotdb"
```


## Tests

* Node-based tests: `yarn mocha` or `npm run mocha`.
* Node-based tests with code coverage: `yarn test` or `npm test`.
* Browser tests using Karma: `yarn karma` or `npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Run `yarn e2e` or `npm run e2e`
    * This runs a js server (via test/e2e/server.js)
