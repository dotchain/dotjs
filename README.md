# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

The dotjs project provides high-level APIs for distributed synchronization of rich data.

## Contents
1. [Status](#status)
2. [DotDB](#dotdb)
    1. [Store](#store)
    2. [Convergent streams](#convergent-streams)
    3. [Collections, derived values](#collections-derived-values)
    4. [Branching](#branching)
    5. [Undo support](#undo-support)
    6. [Refs](#refs)
    7. [Functions/Calculations](#functions-calculations)
    8. [Views](#views)
3. [Installation](#installation)
4. [Tests](#tests)

## Status

This ES6 port of the [Go implementation](https://github.com/dotchain/dot) is ready with full interoperability.  See [library documentation](library.md) for documentation on how to use the library.

The recommended approach is to use DotDB which provides an easier
interface to work with.

## DotDB

DotDB is a distributed, convergent, reactive database-like store built
on top of the DOT's operational-transformation approach. 

DotDB is designed to work on browsers with collaborative edits
automatically converging.  It is reactive in that **views** can be
created which are automatically maintained when the underlying
references change (either locally or remotely). 

This is a standalone ES6 package with no external dependencies, available at **dist/dotdb.js**

### Types

DotDB allows rich types and hierarchies -- including the obligatory
collaborative text -- with a database like flavor but it doesn't
implement SQL semantics (transactions) or use SQL as the query
language.

The basic primitive types in DotDB are:

1, **Null** (no value).  This is gennerally not explicitly stored but
simply the resulting of fetching a key or a ref that does not exist.
2. **Num** (any rational number): `new dotdb.Num(5.3)`
3. **Bool** (a boolean): `new dotdb.Bool(true)`
4. **Text** (unicode editable string): `new dotdb.Text("hello")`

In addition, DotDB supports composite types:

1. **Dict** is a map-like collection of any DotDB values (primitive or
composite).  The key must be a string.
2. **Seq** is an array-like collection of any DotDB values.

Note: **Dict** is generally preferred over **Seq** for most actual
storage needs as this is both simpler and more efficient.  When
ordering is required, a field can specify the order and the whole
collection sorted to yield the **Seq**.

All derived objects are expected to be of the same shape as the
above.

There are two other special types of values:

1. **Runnable** values are value that need to be evaluated.  An
example is **Ref** which holds the path (reference) to another object
in the current.  The value of **Ref** should be treated as the value
it points to.  All runnable values implement a method: `run(store)` to
yield the actual result of evaluating them.
2. **Functions** are values that need to be invoked with
arguments. An example is `Field`. Functions implement a `invoke(store,
args)` method where the `args` field is a `Dict` with keys being the
named parameters required by the function.

### Store

The store is the root versioned object in DotDB.  A store can be
created like so: 

```js

import dotdb from "dotjs/dist/dotdb.js";
let store = new dotdb.Store(url, null);

```

Stores can be serialized and restored.  This is convenient for browser
sessions as they can cache the whole data if needed.

```js
const serialized = store.serialize();
let newStore = new dotdb.Store(url, serialized);
```

The url provided is the network URL to make XHR calls to.  The default
connection management can be overridden by passing a custom `Conn`
object which implements `read(version, limit)` and `write(ops)`
methods (both of which are async/promise-based).

The store does not make any network calls until `store.sync()` is
called, at which point the provided `url` is used for a push/pull
request.  The return value is a promise that carries the error. In any
case, once the promise returns, there is no further calls made and it
is up to the caller to call sync again.  Calling sync when a promise
is in progress simply returns that promise and should be relatively ok
to call multiple times, such as during every [Animation
Refresh](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).

### Convergent streams

The `sync()` call on the store does not actually make any changes to the
store directly.  The store is effectively an immutable object with the
next version available via the `next` property:

```js
let next = store.next;
if (next) {
  store = next.version;
}
```

All values in DotDB act this way: they are immutable for all practical
purposes with changes available via the `next` properties.  Mutating a
value results in the old value being unchanged with the updated value
returned (as well as added via `next` onto the old value).  When
multiple mutations are done on the same base value, the mutations
converge:

```js

const initial = new dotdb.Text("hello");
initial.stream = new dotdb.Stream(); // this is required for convergence

let first = initial.splice(5, 0, " world"); // hello => hello world
let second = initial.splice(0, 1, "H"); // hello => Hello

// now both values "converge" to "Hello world"
first = first.next.version;
second = second.next.version;
if  (first.text != second.text || first.text != "Hello world") {
   throw new Error("unexpected")
}
```

In the example above, the initial value requires a "stream".  This is
where much of the logic of merging values is done.  This is not needed
for values derived from `Store` instances as that comes with a stream
initialized.

### Collections, derived values

Store exposes a **collection** method to access top level
collections. Collections do not need to be created:

```js
let table1 = store.collection("table1");
let row = table1.get("rowId");
if (row instanceof dotdb.Null) {
  // row does not exist
  row = row.replace(new dotdb.Dict({colId1: new Text("some value")}))
}
```

The store and top level collections both use `dotdb.Dict` which allows
accessing items by ID and automatically creating them if they don't
exist.

The example also shows how to create a new row by using  the `replace`
method. This method is available on *all* values including `Null` and
is the primary way to replace an item.

The example above also illustrates derived items: All values derived
from another track their changes:

```js
const initial = store.collection("table1").get("row1").get("col1");
const first = initial.replace(new dotdb.Text("column1"));
const second = initial.replace(new dotdb.Text("column2"));

if (first.next.version.text != second.next.version.text) {
  throw new Error("unexpected");
}
```

### Branching

All dotdb values support git-like branching with push/pull support:

```js
  const parent = new dotdb.Text("hello");
  parent.stream = new dotdb.Stream(); // needed for branching

  let child = parent.branch();

  // the following will not modify parent
  let child =  child.splice(5, 0, "  world");

  // now push all local changes up to parent
  child.push();

  // now child and parent will be in sync
```

### Undo support

There is some plumbing for supporting undos but there is still some
work to expose it, particularly if one wants to limit undos within a
branch.

### Refs

References allow objects to hold a value that points elsewhere in the
store (including within other references):

```js

let store = new dotdb.Store(url, null);

// table1.row1.col2 = reference to table1.row1.col1
store.get("table1").get("row1").replace(new dotdb.Dict{
  col1: new dotdb.Text("hello"),
  col2: new dotdb.Ref(["table1", "row1", "col1"]),
});

store = store.next.version;

// evaluate table1.row1.col2
const col2 = store.get("table1").get("row1").get("col2").run(store);
if (col2.text != "hello") {
  throw new Error("Unexpected col2");
}

// references can be evaluated without them being stored in the db:
const v = dotdb.run(store, new dotdb.Ref(["table1", "row1", "col2"]));
if (v.text != col2.text) {
  throw new Error("Unexpected col2");
}

```

The example above also illustrates the `dotdb.run` function which
evaluates any `runnable` value. The other runnable value would be
`call expressions` (NYI) or any user defined runnable.

### Functions/Calculations

DotDB supports values which are "functions" -- they can be "invoked"
with arguments to yield results (which are expected to be DotDB
values).

**Field** is one such function value:

```js
const fieldFn = new dotdb.Field();
const evaluated = fieldFn.invoke(store, new dotdb.Dict({
  "obj": new dotdb.Ref(["table1", "row1"]),
  "field": new dotdb.Text("col1"),
}))

// evaluated is now same as table1.row1.col1
```

As shown in the example, the arguments to Field are of the form of a
hash with `obj` and `field` (which are themselves evaluated).

#### Calculations are reactive

The interesting thing about calculations is that if the underlying
args passed to it is modified, the evaluated value changes
correspondingly -- using the `next.version` pattern.

### Views

Views are **runnable** values that esseentially invoke a function with
argumeents:

```js
const viewDef = new dotdb.View(
  new Dict({
    viewFn: new dotdb.Field(), // function to execute is field
    obj: new dotdb.Ref(["table1", "row1"]),
    field: new dotdb.Text("col1"),
  })
const view = dotdb.Run(store, viewDef);
);

```
the example above creates a **view** for `table1.row1.col1`.  As the
store changes, the view tracks the computed value at all times.  For
example, if `table1.row1` is itself a `Ref` or a `View`, it is
evaluated  and then the `col1` value is extracted from it.

The difference between simply calling
`store.collection('table1').get('row1').get('col1')` vs constructing
the view is that **views are formulas that can be stored within the
database**. 

The `map` function, for example, provides a way to construct a view
that modifies an existing table or row.  It is useful to store this
incantation within DotDB itself (and posisbly even refer to this
view to construct more complicated views).

Note that DotDB does not automatically evaluate all views.  The caller
still has to call `dotdb.Run(store, viewDef)` to create a stream for
the evaluation but once created, the stream will keep updating with
calls to `next()` like all regular values.

## Installation

There is no plan to make this code available via NPM.  The suggested
way to use this library is by adding the following to your
package.json and using it. 

```
yarn add https://github.com/dotchain/dotjs
```

or

```
npm install https://github.com/dotchain/doatjs
```

## Tests

* Node-based tests: `yarn mocha` or `npm run mocha`.
* Node-based tests with code coverage: `yarn test` or `npm test`.
* Browser tests using Karma: `yarn karma` or `npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Run `yarn e2e` or `npm run e2e`
    * This runs a js server (via test/e2e/server.js)
