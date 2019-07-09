# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

The dotjs project provides ES6 support for distributed synchronized reactive functional data-structures.

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
    8. [Git-like ability to branch and push/pull](#git-like-ability-to-branch-and-push-pull)
    9. [Automatic Undo/Redo](#automatic-undo-redo)
    10. [Streaming](#streaming)
    11. [References](#references)
    12. [View persistence using Reflect](#view-persistence-using-reflect)
    13. [Additional functionality](#additional-functionality)
    14. [Long term plans](#long-term-plans)
4. [Tests](#tests)

## Status

The [lib](lib/README.md) package is relatively stable.  The [db](db/README.md) package is still going through some changes.

## Installation

There is no npm support.  Please use the repo link directly:

```sh
yarn add esm
yarn add https://github.com/dotchain/dotjs
```

A single-file es6 distribution is available via [dist/dotdb.js](https://github.com/dotchain/dotjs/blob/master/dist/dotdb.js).

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

Values in DotDB *converge* when mutated by multiple writers. The convergence honors the *immutable* feel by providing the converged value through `latest()`.  The original value is left intact:

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

    Note: Convergence requires a *stream* associated with the value.
    In the example, the initial value is setup with a new stream.
    In practice, this is rarely needed as all derived values simply
    inherent the *stream* of their parents.  The root object in an
    app is typically created with a stream (say, via `Session.connect`)
    but these examples are all standalone and so the stream is explicitly
    initialized.

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

A slightly different example of reactive behavior is when the field key changes:

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

Standard "Functional Reactive" formulations (such as with [ReactiveX/rxjs](https://github.com/ReactiveX/rxjs), [Sodium](https://github.com/SodiumFRP/sodium)) tend to be about data flow in one direction.  DotDB takes a fairly different route attempting to make data flow bi-directional: most derivations are meant to be meaningfully modified with the mutations being proxied to the underlying values quite transparently:

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

The specific implementations of `field`, `map`, `filter`, `group` and other such functions provided by `DotDB` all try to have reasonable behavior for mutating the output and proxying those changes upstream.  For a given definition of the reactive forward data flow, multiple reverse flows can be defined and all the `bi-directional` primitives in `DotDB` pin these behaviors.  Custom behaviors are possible (though intricate to get right at this point) but the inherent strength of two-way bindings is that the usual complexity of event-handling can be avoided with a fairly declarative setup.

     One of the goals here is to use DotDB to build UI apps where
     the complexities of event-handling are not used.  Instead, much
     of that behavior is obtained via simple composition-friendly
     two-way bindings. For example, one can pass a field
     of a dictionary to a text input and simply have the text input
     write directly (i.e. changes are applied onto the field and so
     the dictionary itself is updated).  This approach allows a
     more declarative approach to not just rendering but also
     actual edits/mutations.

### Demand-driven computation

All of DotDB uses a demand-driven computation model (Pull FRP).  This avoids a lot of the pit-falls of a pure Pull-based system (such as the need for schedulers, book-keeping of subscriptions -- and the cost of computation being based on all defined derivations even if those derivations are not currently needed).  

One of the interesting consequences of this approach is that defining a large number of `views` incurs almost no cost if they are never "used".  Another consequence is the ability to schedule work better since all updates only happen when the `latest()` call is initiated, so different parts of the app can be updated at different frequencies.

The biggest benefit of the formulation here is the ability to build composition friendly declarative structures.

    One of the goals of DotDB is to support building a full UI,
    using the computation scheme here with support for hidden views
    (such as mobile or desktop etc) with no cost for those views
    unless they are rendered.

### Network synchronization

Network synchronization is via a `Session` singleton and a `root` object (which is typically a `Store` instance):

```js
// savedSession is initialized via the root object
const savedSession = Session.serialize(new Store());
const root = Session.connect(url, Session.serialize(new Store()));

// now root is an instance of Store and can be used
```

The store maintains a top-level collection of `Dict` objects, meant for `users`, `messages` or other typical top-level collections.  Once a store is created, the rest of the objects simple have their streams inherited from it and the rest of the code can quite transparently work without consideration of any remote activity.

Synchronization is explicit (in keeping with the immutable feel as well as the explicit control over computation) via `push()`:

```js
...
store.push().then(() => {
  // do err handling include binary exponential fallback etc.
});
store.pull().then(() => {
  // do err handling
})
```

Push and pull only make a single attempt even in case of success -- the caller is expected to keep things alive by repeated invocations (with appropriate backoff).  This approach allows graceful ways for callers to suspend the synchronization as needed.

### Persistence

The whole `Store` instance can be persisted (say using LocalStorage) via a call to `Session.serialize(store)` and then restored via a call to `Session.connect(url, serialized)`.  

This effectively creates a snapshot of the session state and restores things to the earlier state (respectively).

Individual values can also be serialized using this approach.  A calculation (such as `field(s, o, k)`) can also be represented as a value.  See [View persistence](#view-persistence-using-reflect) for how functions and such calculations can be extracted for calculating on demand.

### Git-like ability to branch and push/pull

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

All values also support automatic undo/redo via `Session.undoable`:

```js
import {expect} from "chai";
import {Session, Stream, Text} from "dotjs/db";
describe("Undo`", () => {
  it("should undo redo", ()=> {
    const parent = new Text("hello").setStream(new Stream);
    const child = Session.undoable(parent);

    child.splice(5, 0, new Text(" world"));
    parent.splice(0, 1, new Text("H"))

    expect(parent.latest().text).to.equal("Hello world");
    expect(child.latest().text).to.equal("Hello world");

    child.undo();
    expect(parent.latest().text).to.equal("Hello");
    expect(child.latest().text).to.equal("Hello");

    child.redo();
    expect(parent.latest().text).to.equal("Hello world");
    expect(child.latest().text).to.equal("Hello world");
  });
});
```

Note that the undo/redo functions have side-effects and their scope (i.e what they undo/redo) is limited to the `Session.undoable()`.

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

Some of this remote proxying is relatively easy to implement at this point though the exact API for this is not designed yet.

### References

DotDB has a built-in value `Ref(path)` which evaluates to the value at the `path` specified.  For instance:

```js
import {expect} from "chai";
import {field, Dict, Ref, Store, Stream, Text} from "dotjs/db";
describe("Ref", () => {
  it("should evaluate references", ()=> {
    const store = new Store().setStream(new Stream);
    const table1 = store.get("table1");
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

### View persistence using Reflect

Calculations can also be persisted using `Reflect.definition()`. This returns the underlying definition (i.e. the derivation) as a value itself which can be stored within the db.  These views are not automatically evaluated until a call to `run(store, view)` at which point the resulting value is equivalent to the original value.

This is quite useful to persist rarely used calculations for use across sessions.

```js
import {expect} from "chai";
import {field, run, Dict, Ref, Store, Stream, Text} from "dotjs/db";
import {Reflect} from "dotjs/db/reflect.js";

describe("Reflect", () => {
  it("should persist calculations", ()=> {
    const store = new Store({
      hello: new Dict({
        world: new Text("boo"),
        boo: new Text("hoo")
      }),
      calcs: new Dict()
    }).setStream(new Stream);

    // calc1 = store[hello][store.hello.world]
    // which is store[hello][boo] = hoo
    const calc1 = field(
      store,
      new Ref(["hello"]),
      new Ref(["hello", "world"])
    );
    expect(calc1.text).to.equal("hoo")

    // now persist this calculation
    const def = Reflect.definition(calc1);
    store.get("calcs").get("calc1").replace(def);

    // now updatee store.hello.boo to newhoo
    store.get("hello").get("boo").replace(new Text("newhoo"));

    // validate that the new calc updates
    const s = store.latest();
    const val = run(s, s.get("calcs").get("calc1"));
    expect(val.text).to.equal("newhoo");
  });
});
```
### Additional functionality

DotDB has support for `sequences`, `GROUP BY` and `views` in general.  These are not quite stable at this point and will get documented once they are sufficiently stable.

### Long term plans

The long term plan is to build UI primitives (such as TextInput) which take streamed DotDB values with the whole app being just a view in the database.  This will allow dynamically updating running apps gracefully.

## Tests

* Node-based tests: `cd db; yarn mocha` or `cd db; npm run mocha`.
* Node-based tests with code coverage: `cd db; yarn test` or `cd db; npm test`.
* Browser tests using Karma: `cd db; yarn karma` or `cd db; npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Run `cd db; yarn e2e` or `cd db; npm run e2e`
    * ~This runs a js server (via test/e2e/server.js)~
