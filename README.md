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
    3. [Reactive](#reactive)
    4. [Bi-directional](#bi-directional)
    5. [Demand-driven computation](#demand-driven-computation)
    6. [Network synchronization](#network-synchronization)
    7. [Persistence](#persistence)
    8. [Git-like functionality](#git-like-functionality)
    9. [Automatic Undo/Redo](#automatic-undo-redo)
    10. [Streaming](#streaming)
    11. [References](#references)
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

### Reactive

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

### Bi-directional

Standard "Functional Reactive" formulations (such as with [ReactiveX/rxjs](https://github.com/ReactiveX/rxjs), [Sodium](https://github.com/SodiumFRP/sodium)) tend to be about data flow in one direction.  DotDB takes a fairly different route attempting to make data flow bi-directionally: most derivations are meant to be meaningfully modified with the mutations being proxied to the underlying values quite transparently:

```js
import {expect} from "chai";
import {field, Dict, Null, Store, Stream, Text} from "dotjs/db";
describe("Bi-directional", () => {
  it("proxies edits on fields", () => {
    const initial = new Dict({
      hello: new Text("world")
    }).setStream(new Stream());

    const hello = field(new Store(), initial, new Text("hello"));
    hello.replace(new Text("goodbye!"));

    expect(initial.latest().get("hello").text).to.equal("goodbye!");
  });
});
```

The example above is for the relatively simple case of accessing a field dynamically.  A more difficult use case would be working with output of filtering a dictionary:

```js
it("proxies edits on filtered dictionaries", () => {
  const initial = new Dict({
    hello: new Text("world"),
    boo: new Text("goop")
  }).setStream(new Stream());
  // see examples/bidirectional_test.js for fn definition
  const fn = new PrefixMatcher("w");
  const filtered = filter(new Store(), initial, fn);

  expect(filtered.get("boo")).to.be.instanceOf(Null);
  expect(filtered.get("hello").text).to.equal("world");
});
```

The specific implementations of `field`, `map`, `filter`, `group` and other such functions provided by `DotDB` all try to have reasonable behavior for mutating the output and proxying those changes upstream.  For a given definition of the reactive forward data flow, multiple reverse flows can be defined and all the `bi-directional` primitives in `DotDB` pin both behaviors.  Custom behaviors are possible (though intricate to get right at this point) but the inherent strength of two-way bindings is that the usual complexity of event-handling can be avoided with a fairly declarative setup.

### Demand-driven computation

All of DotDB uses a demand-driven computation model (Pull FRP).  This avoids a lot of the pit-falls of a pure Pull-based system (such as the need for schedulers and the cost of computation being based on all defined computation rather those computations required).  

One of the interesting consequences of this approach is that defining a large number of views incurs almost no cost if they are never updated.  Another consequence is the ability to schedule work better since all updates only happen when the `latest()` call is initiated.  There are other subtle ways to introduce scheduling priorities without affecting  the reasoning ability more gracefully though this isn't incorporated yet.

    One of the goals of DotDB is to support building a full UI using the computation scheme here with support for hidden views (such as mobile or desktop etc) with no cost for those views unless they are rendered.

### Network synchronization

Network synchronization is via a root `Store` object:

```js
const store = new Store(url);
```

The store maintains a top-level collection of `Dict` objects, meant for `users`, `messages` or other typical top-level collections.  Once a store is created, the rest of the objects simple have their streams inherited from it and the rest of the code can quite transparently work without consideration of any remote activity.

Store synchronization is explicit (in keeping with the immutable feel as well as the explicit control over computation) via `sync()`:

```js
...
store.sync().then(err => {
  // do err handling include binary exponential fallback etc.
})
```

Sync only makes a single sync attempt even in case of success -- the caller is expected to keep things alive by repeated invocations (with appropriate backoff).  This approach allows graceful ways for callers to suspend the synchronization as needed.

### Persistence

The whole `Store` instance can be persisted (say using LocalStorage) via a call to `store.serialize()` and then restored via a call to `new Store(url, serialized)`.  

This effectively creates a snapshot of the session state.

Individual values can also be serialized.  This includes functions and computations -- which function a bit like stored procedures and views in database terminology except that these also show up as strongly typed objects (and so allow programmatic access to fields and can also  be transformed as if it were data).

```js
Details to be added
```

### Git-like functionality

All DotDB values also support git-like branch, push/pull semantics:

```js
import {expect} from "chai";
import {Stream, Text} from "dotjs/db";
describe("Branch", () => {
  it("should branch and merge", ()=> {
    const parent = new Text("hello").setStream(new Stream());
    const child = parent.branch();

    const child1 = child.splice(5, 0, ", bye!");
    const parent1 = parent.splice(5, 0, " world");

    expect(parent.latest().text).to.equal("hello world");
    expect(child.latest().text).to.equal("hello, bye!");

    child1.push()

    expect(parent.latest().text).to.equal("hello world, bye!");
    expect(child.latest().text).to.equal("hello, bye!");

    child1.pull();

    expect(parent.latest().text).to.equal("hello world, bye!");
    expect(child.latest().text).to.equal("hello world, bye!");
  });
});
```
### Automatic Undo/Redo

All values also support automatic undo/redo with the undo/redo being limited to the current branch.

```js
examples tbd
```

###  Streaming

All values can be `streamed` to get the changes made to it, not just the latest value:

```js
const initial = new Text("hello").setStream(new Stream());

initial.splice(0, 1, "H"); // hello => Hello
initial.splice(5, 0, " world.") // Hello => Hello world.

// get next versions
const {change, version} = initial.next;
const {change: c2, version: final} = version.next;

expect(final.text).to.equal("Hello world.");
```

These changes can also be applied to the initial object to compute the final result.  This allows a mechanism for thin clients (such as on mobile devices) to offload expensive views to the cloud but *collect* those changes and apply them locally.

Some of this remote proxying is relatively easy to implement at this point though the exact API for this is not clear yet.

### References

DotDB has a built-in value `Ref(path)` which evaluates to the value at the `path` specified.  For instance:

```js
import {expect} from "chai";
import {field, Dict, Ref, Store, Text} from "dotjs/db";
describe("Ref", () => {
  it("should evaluate references", ()=> {
    const store = new Store();
    const table1 = store.collection("table1");
    const row1 = table1.get("row1").replace(new Dict({
      "hello": new Text("world")
    }))
    const ref = new Ref(["table1", "row1"])

    const hello = field(store, ref, new Text("hello"));
    expect(hello.latest().text).to.equal("world");
  });
});
```

This allows the ability to represent rich data-structures and single-instancing of values.  In addition, any computation based on a ref will automatically update if the ref is changed.

## Tests

* Node-based tests: `cd db; yarn mocha` or `cd db; npm run mocha`.
* Node-based tests with code coverage: `cd db; yarn test` or `cd db; npm test`.
* Browser tests using Karma: `cd db; yarn karma` or `cd db; npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Run `cd db; yarn e2e` or `cd db; npm run e2e`
    * ~This runs a js server (via test/e2e/server.js)~
