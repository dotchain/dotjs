# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

The dotjs project provides high-level APIs for distributed synchronization of rich data.

## Contents
1. [Status](#status)
2. [Example Walkthrough](#example-walkthrough)
    1. [String example](#string-example)
    2. [Streams](#streams)
    3. [Value streams and change streams](#value-streams-and-change-streams)
    4. [Branching](#branching)
    5. [Undo support](#undo-support)
    6. [Rich types](#rich-types)
    7. [Network connection](#network-connection)
    8. [Network backend](#network-backend)
    9. [Module primitives and JSDoc documentation](#module-primitives-and-jsdoc-documentation)
    10. [Golang and Javascript interop](#golang-and-javascript-interop)
    11. [Comparison to RxJS and other reactive frameworks](#comparison-to-rxjs-and-other-reactive-frameworks)
3. [Installation](#installation)
4. [Tests](#tests)
5. [Demo](#demo)
6. [Roadmap](#roadmap)

## Status

This ES6 package is a port of the [Go implementation](https://github.com/dotchain/dot) that should fully interoperate with that version.

The package is usable right now and mainly needs testing.  See [Roadmap](#Roadmaap)


## Example Walkthrough

The simplest way to use dotjs is using the streams API.  Here is an
example using strings (see
[string_test.js](https://github.com/dotchain/dotjs/blob/master/examples/simple/string_test.js)
for code).

### String example

```js
    // create  a new text stream
    const s = new TextStream("hello");
    
    // modify: "hello" => " world!"
    // note: streams are immutable, so modifying them
    // returns a new value
    let s1 = s.splice(s.value.length, 0, " world!");
    
    // in parallel, modify: "hello" => "Hello"
    // s2 below will not be affected directly by s1
    let s2 = s.splice(0, 1, "H");

    // converge! get the latest value of both s1 & s2
    s1 = s1.latest();
    s2 = s2.latest();

    // ensure they are both "merged"
    expect(s1.value).to.equal("Hello world!");
    expect(s2.value).to.equal("Hello world!");  
```
### Streams

Streams provide a simple abstraction to represent a value that changes
in time. Instances of the stream have a `value` field (that holds the
immutable value at that point) and a `next` field (which tracks the
next **version** and associated **change**).

Each mutation on a single stream instance acts like an immutable
update, yielding the result of that particular change but not
factoring in the other changes made on that instance. But streams
`converge`: all the separate instances have their `next` field updated
such that chasing the versions (through **next**) is guaranteed to
end with the same value for all instances.  The example above
illustrates this (by using the *conveninence function* **latest()**).

### Value streams and change streams

The example above used a `TextStream` which has the `value` and `next`
fields. A change stream only has the `next` field and is used to track
only changes without accumulating any values.  Value streams are
typically implemented on top of the change stream by taking the next
change from the change stream and applying it to values.  The change
stream supports features like branching, undo etc and every value
stream in **dotjs** exposes the underlying change stream via the
`stream` field for the rare situation where this is needed.

### Branching

Streams support git-like branching with push/pull support. See
[code](https://github.com/dotchain/dotjs/blob/master/examples/simple/branch_test.js).

```js
  // create a parent raw stream + branch
  const parent = new Stream();
  const child = branch(parent);
  
  // create text streams out of both
  let sParent = new TextStream("hello", parent);
  let sChild = new TextStream("hello", child);
  
  // modify child: "hello" => " world!"
  sChild = sChild.splice(sChild.value.length, 0, " world!");

  // expect parent to not have changed
  expect(sParent.latest()).to.equal(sParent)
  
  // modify parent: "hello" => "Hello"
  sParent = sParent.splice(0, 1, "H");

  // expect child to not have changed
  expect(sChild.latest()).to.equal(sChild);

  // now pull parent into child
  sChild.stream.pull()
  sChild = sChild.latest()
  expect(sChild.value).to.equal("Hello world!");
  expect(sParent.latest()).to.equal(sParent.latest())

  // now push child to parent
  sChild.stream.push();
  sParent = sParent.latest();
  expect(sParent.value).to.equal("Hello world!");
```

### Undo support

DotJS includes built-in support for undos and redos (see [code](https://github.com/dotchain/dotjs/blob/master/examples/simple/undo_test.js))

```js
  // create an undoable text stream
  let text = new TextStream("hello", undoable(new Stream()));

  // "hello" => "hello world"
  text = text.splice(5, 0, " world");
  expect(text.value).to.equal("hello world");

  // undo!
  text.stream.undo();
  text = text.latest();
  expect(text.value).to.equal("hello");

  // redo!
  text.stream.redo();
  text = text.latest();
  expect(text.value).to.equal("hello world")
```

### Rich types

Custom rich types can be defined with ability to treat individual
fields themselves as substreams (such that mutating the field
effectively updates the parent structure).  The example definition
is
[here](https://github.com/dotchain/dotjs/blob/master/examples/simple/custom_struct.js)
with the code below showing how to use classes defined like that:

```js
  // create a task stream (which is defined in custom_struct.js)
  let task = new TaskStream(new Task(false, "incomplete task"));

  // note that the description field here is a TextStream
  // because it is a field of TaskStream (not Task).
  let descStream = task.description();

  // now update the description and see it reflected on parent.
  descStream = descStream.replace("task not yet completed");
  task = task.latest();

  // the following fetches the actual Task value via `.value`
  expect(task.value.description).to.equal("task not yet completed");
```

The running code for the above is
[here](https://github.com/dotchain/dotjs/blob/master/examples/simple/custom_test.js).

The example above uses map-like objects ("structs") and dotjs also 
support collection-like values. The following illustrates how to
work with collection streams (see code [here](https://github.com/dotchain/dotjs/blob/master/examples/simple/custom_test.js)):

```js
  // create a couple of tasks (which is defined in custom_struct.js)
  let tasksValue = new Tasks(
    new Task(false, "Incomplete 1"),
    new Task(false, "incomplete 2")
  );

  // create a tasks stream out of that
  let tasks = new TasksStream(tasksValue);

  // get the description of the second task as a TextStream
  let description = tasks.item(1).description();

  // splice a task at index 0; this should change index of
  // description to 2.
  tasks = tasks.splice(0, 0, new Task(true, "Completed"));
  description = description.latest();

  // now update description: "incomplete 2" => "Incomplete 2"
  description = description.splice(0, 1, "I");

  // now confirm latest tasks matches at index 2
  expect(tasks.latest().value[2].description)
    .to.equal("Incomplete 2");
```

The example above illustrates some interesting traits:

1. Collection streams expose array methods like **splice**, **push**,
**pop**.  In addition, sub-streams of individual entries can be
created using **item(idx)** calls.

2. Item streams maintain their index appropriately when the collection
is edited.  In the example above, the parent edit inserted a task
before the item index but when the edit of the description field
happened, it landed on the same item it used to refer to.

### Network connection

The network client API simply provides a change stream that can then
be connected to the app state with bulk of the code simply not even
being aware of the network synchronization:

```js
  // create a network connection
  const conn = new Transformer(new Conn(url, fetch));

  // create a session
  const session = new Session().withLog(console);

  // connect that session to a text stream
  const text = new TextStream("hello", session.stream);

  // update that text stream
  text.splice(5, 0, " world!");

  // merge the session
  return session.push(conn)
    .then(() => session.pull(conn))
```

A few things to note:

1. The session object actually does not do any network operation until
a call to `session.push` or `session.pull`.

2. The connection needs to be provided as a parameter to `push` and
`pull`. In addition, these return promsies and only do one round of
fetching/posting.  It is expected that push and pull are called
periodically to keep the connection going. These APIs return existing
promises if they are in progress and so it is setup for these to be
called within `requestAnimationFrame` for instance.

3. In addition, the pull API guarantees that the actual stream updates
happen synchronously -- all the fetching is stashed and only applied on the
next call to `pull`. This provides a reliable way to pause fetching
and pushing if needed.

4. The example does not show this but sessions can be stopped and
restarted. Once a session stops, the `session.pending` and
`session.version` properties can be passed to a new session (via
`(new Session()).withPending(pending, merge, version)`) and the new session
will continue from the point things were left at.  Note that the whole
app state would also need to be saved and used to continued.

### Network backend

The example and tests use a [pure-JS in memory
backend](https://github.com/dotchain/dotjs/blob/master/test/e2e/server.js)
which can be extended to various db solutions.  At this point, the
only existing DB solutions are via the [golang
backends](https://github.com/dotchain/dot#server) but more native JS
options will happen soon.

### Module primitives and JSDoc documentation

The JSDoc for dotjs is split into a few parts:

1. [Core](core.md) documents the changes and values.
2. [Streams](streams.md) documents the primitive stream types.
3. [Session](session.md) documents session management and networking.
4. [Types](types.md) documents custom struct, list and stream types.

The low-level implementation of dotjs uses the concept of changes and
values.  A change is an immutable data representing a specific
mutation of a value.  DotJS defines three core changes (*Replace*,
*Splice* and *Move*) and a couple of **composition** changes to build
richer changes using the other three as building blocks:

* *PathChange* takes a *path* (such as `["description"]` for the
descrpition field and `[5, "description"]` for the description field
of the 5th element) and a change to apply at that path.

* *Changes* takes a collection of changes to apply in sequence,

All changes in dotjs implement the *merge()* method to figure out how
two changes to the same value can be transformed (using operations
transformation).

Values in dotjs implement the `apply(change)` method to apply any of
these changes immutably.  The standard values are `Null` (because
`null` itself is not a valid value as it does not have the apply
method), `Text` (to represent an editable text) and `Atomic` (to
represent a value that is treated as an atomic single value without
edits).  There are also generic list and map types but these are meant
to be used rarely if at all with the custom list and struct types (as
illustrated in examples above) preferred.

These types are low-level and rarely directly used. For instance, the
TextStream class directly exposes the `splice()` method.  And
replacing sub-streams automatically causes the correct `PathChange`
to be used.

Occasionally though, custom mutation types will be needed and it is
possible to define them.  There isn't an example for this yet but
hopefully, I'll add one soon.

### Golang and Javascript interop

Much of the DOTJS platform has been written with interop in mind and
as such both the client and server can be written in either Javascript
or Golang.  But care must be used with custom types (particularly with
StructDef or ListDef) to ensure that corresponding types are
possible.  The exact procedure here needs to be documented but the
basic idea is to maintain a 1-1 correspondence between a golang struct
and the corresponding StructDef.

### Comparison to RxJS and other reactive frameworks

The streams based programming might seem similar to
(RxJS)(https://github.com/ReactiveX/rxjs) or other reactive
frameworks.

0. Streams in dotjs are **convergent** as the focus of dotjs is to
enable simple distributed synchronization, not just reactive code.
1. Streams in DotJS do not use the observer pattern. In particular,
there are no methods to listen for changes. Instead, changes are
**pulled** and **pushed** explicitly.  It is possible to implement
notifications in the underlying Stream but notifications but the
actual payload of notifications is dependent on the context (i.e. two
stream instances of the same family may need to get different `next`
values to converge) and so it gets a bit confusing when using that
approach.
2. Derived stream simply implement the `next` method (like how
sub-streams do) which allows all computation to be lazy. If a derived
stream is no longer used, it does not have to manage lifecyle and
unregister itself.
3. The lack of callbacks leads to a more pleasant synchronous style of
code that is easier to read.

## Installation

There is no plan to make this code available via NPM.  The suggested
way to use this library is by adding the following to your
package.json and using it. 

```
yarn add https://github.com/dotchain/dotjs
```

or

```
npm install https://github.com/dotchain/dotjs
```

## Tests

* Node-based tests: `yarn mocha` or `npm run mocha`.
* Node-based tests with code coverage: `yarn test` or `npm test`.
* Browser tests using Karma: `yarn karma` or `npm run karma`
    * This uses karma and headless chrome
* Browser-based end-to-end tests:
    * Run `yarn e2e` or `npm run e2e`
    * This runs a js server (via test/e2e/server.js)

## Demo

A full TODO-MVC demo is available [here](https://dotchain.github.io/demos/todomvc.es6/index.html).

The source for that demo is over at [dotchain/demos](https://github.com/dotchain/demos/tree/master/todomvc.es6).

The server portion of the demo is not documented yet (but it is just another version of eithere [server.go](https://github.com/dotchain/dotjs/blob/master/demo/server.go) or [server.js](https://github.com/dotchain/dotjs/blob/master/test/e2e/server.js).

## Roadmap

The roadmap:

1. Add more tests as some key functionality is still not well covered.
2. Build full interop suite for ES6 vs Go, Front-End vs Back-End
3. Document how to write structs and lists so that they can interop between Go and JS.
4. Implement Refs and native JS backends.
5. Implement filter and other data transforms that require stateful translation of changes but help write reactive declarative code.


Done:

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
8. ~Implement session with local transformations.~
9. ~Implement server handler (no storage yet though)~
10. ~Implement in-memory backend and wire e2e tests to it.~
11. ~Add custom struct and collection type factories.~
12. ~Add Move mutation type.~
13. ~Build actual TODO-MVC example.~

