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
4. [Reactive](#reactive)
5. [Tests](#tests)

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

Values in DotDB are effectively immutable:

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

Values in DotDB *converge* when mutated by multiple writers. The convergence honors the *immutable* feel by simply leaving the original value intact but instead making the convergence available via the *latest()* method.

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

## Reactive

Values in DotDB are reactive.  The example below illustrates fetching a key from a dictionary.  This value keeps up with any changes to the dictionary:

```js
import {expect} from "chai";
import {Dict, Stream, Text} from "dotjs/db";
describe("Reactive", () => {
  it("fields update with underlying changes", ()=> {
    const initial = new Dict({
      hello: new Text("world")
    }).setStream(new Stream());

    const hello = initial.get("hello");
    initial.get("hello").replace(new Text("goodbye!"));

    expect(hello.latest().text).to.equal("goodbye!");
    expect(initial.latest().get("hello").text).to.equal("goodbye!");
  });
});
```

A slightly more involved example uses the `field()` function which works on any value. For actual `Dict` or a similar, it returns the `get()` value and for the rest it returns Null.  The reactive part is the fact that it keeps up with the underlying object:

```js
it("fields update even if the underlying object changes", ()=> {
  const initial = new Text("hello").setStream(new Stream());

  const hello = field(new Store(), initial, new Text("hello"));
  expect(hello).to.be.instanceOf(Null);

  initial.replace(new Dict({hello: new Text("world")}));
  expect(hello.latest().text).to.equal("world")
});
```

A slightly different reactive behavior is when the field key changes:

```js
it("fields update when the key changes", ()=> {
  const initial = new Dict({
    hello: new Text("world"),
    boo: new Text("hoo")
  }).setStream(new Stream());
  const key = new Text("hello").setStream(new Stream());
  const hello = field(new Store(), initial, key);

  expect(hello.text).to.equal("world");

  key.replace(new Text("boo"));
  expect(hello.latest().text).to.equal("hoo");
});
```

## Tests

* Node-based tests: `yarn mocha` or `npm run mocha`.
* Node-based tests with code coverage: `yarn test` or `npm test`.
* Browser tests using Karma: `yarn karma` or `npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Run `yarn e2e` or `npm run e2e`
    * This runs a js server (via test/e2e/server.js)
