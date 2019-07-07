# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

The dotjs project provides ES6 support for distributed sychronized reactive functional datastructures.

This includes two packages: a low level [lib](lib/README.md) package and a much higher level [dotdb](db/README.md) package.  Both packages effectively interoperate with each other and the [Go](https://github.com/dotchain/dot) implementation but the [dotdb](db/README.md) approach is easier to use.

## Contents
1. [Status](#status)
2. [Installation](#installation)
3. [DotDB](#dotdb)
    1. [Functional](#functional)
    2. [Convergent](#convergent)
4. [Tests](#tests)

## Status

The [lib](lib/README.md) package is relatively stable.  The [db](db/README.md) package is still going through some changes.

## Installation

There is no npm support.  Please use the repo link directly:

```sh
yarn add esm
yarn add https://github.com/dotchain/dotjs
```

A single-file output is available via [dist/dotdb.js](https://github.com/dotchain/dotjs/blob/master/dist/dotdb.js).

## DotDB

DotDB is a functional, convergent, reactive, synchronized store.

### Functional

The value types in DotDB are effectively immutable:

```js
import {expect} from "chai";
import {Text} from "dotjs/db";

it("should not mutate underlying value", ()=> {
  const initial = new Text("hello");
  const updated = initial.splice(5, 0, " world");
  expect(initial.text).to.equal("hello");
  expect(updated.text).to.equal("hello world");
});
```
### Convergent

The value types in DotDB *converge* when mutated by multiple writers. The convergence honors the *immutable* feel by simply leaving the original value intact but instead making the convergence available via the *latest()* method.

```js
import {expect} from "chai";
import {Stream, Text} from "dotjs/db";
describe("Convergence", () => {
  it("should converge", ()=> {
    const initial = new Text("hello").setStream(new Stream());
    const updated1 = initial.splice(5, 0, " world");
    const updated2 = initial.splice(5, 0, ", goodbye!")

    expect(initial.text).to.equal("hello");
    expect(updated1.text).to.equal("hello world");
    expect(updated2.text).to.equal("hello, goodbye!");

    expect(initial.latest().text).equal("hello world, goodbye!")
    expect(updated1.latest().text).equal("hello world, goodbye!")
    expect(updated2.latest().text).equal("hello world, goodbye!")
  });
});
```

  Note: Convergence requires a *stream* associated with the value. In the example, the initial value is setup with a new stream. In practice, this is rarely needed as all derived values simply inherent the *stream* from their parents and the root object is created at app initialization.  But the examples here are all standalone and so will include that as part of the constructor.

## Tests

* Node-based tests: `yarn mocha` or `npm run mocha`.
* Node-based tests with code coverage: `yarn test` or `npm test`.
* Browser tests using Karma: `yarn karma` or `npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Run `yarn e2e` or `npm run e2e`
    * This runs a js server (via test/e2e/server.js)
