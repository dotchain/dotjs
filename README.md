# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

Distributed synchronization using Operations Trannsformations

## Contents
1. [Status](#status)
2. [Example Walkthrough](#example-walkthrough)
    1. [String example](#string-example)
    2. [Streams](#streams)
    3. [Value streams and change streams](#value-streams-and-change-streams)
    4. [Branching](#branching)
    5. [Rich types](#rich-types)
    6. [Custom change types](#custom-change-types)
    7. [Network connection](#network-connection)
    8. [Network backend](#network-backend)
    9. [Golang and Javascript interop](#golang-and-javascript-interop)
3. [Reference Documentation](#reference-documentation)
4. [Installation](#installation)
5. [Tests](#tests)
6. [Demo](#demo)

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
8. ~Implement session with local transformations.~
9. ~Implement server handler (no storage yet though)~
10. ~Implement in-memory backend and wire e2e tests to it.~
11. ~Add custom struct and collection type factories.~
12. ~Add Move mutation type.~
13. Build actual TODO-MVC example. ** In Progress **
14. Implement e2e tests for interop: js vs golang (front-end vs backend and vice versa).
15. Add refs.

## Example Walkthrough

The simplest way to use dotjs is using the streams API.  Here is an
example using strings (see
[simple_test.js](https://github.com/dotchain/dotjs/blob/master/examples/simple/string__test.js)
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
    // s2 below will not be affected directly s1
    let s2 = s.splice(0, 1, "H");

    // converge! get the latest value of both s1 & s2
    s1 = s1.latest();
    s2 = s2.latest();

    // ensure they are both "merged"
    expect(s1.value).to.equal("Hello world!");
    expect(s2.value).to.equal("Hello world!");  
  });
});
```
### Streams

Streams provide a simple abstraction to represent a value that change
in time. Instances of the stream have a `value` field (that holds the
immutable value at that point) and a `next` field (which tracks the
next **version** and associated **change**).

Each mutation on a single stream instance act like an immutable
update, yielding the result of that particular change but not
factoring in the other changes made on that instance. But streams
`converge`: all the separate instances have their `next` field updated
such that chasing the versions (through **next**) is guaranteed to
result in the same value for all instances.  The example above
illustrates this (by using the *conveninence function* **latest()**).

### Value streams and change streams

The example above used a `TextStream` which has the `value` and `next`
fields. A change stream only has the `next` field and is used to track
only changes without accumulating any values.  Value streams are
typically implemented on top of the change stream by take the next
change from the change stream and applying it to values.  The change
stream supports features like branching, undo etc and every value
stream in **dotjs** exposes the underlying change stream via the
`stream` field for the rare situation where this is needed.

### Branching

Streams support git-like branching with push/pull support. See
[code](https://github.com/dotchain/dotjs/blob/master/examples/simple/branch_test.js)
for running code.

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

### Rich types

Custom rich types can be defined with ability to treat individual
fields themselves as substreams (such that mutating the field
effectively updates the parent structure).  The example definition
is
[here](https://github.com/dotchain/dotjs/blob/master/examples/simple/custom_struct.js)
with the code below being how to use classes defined like that:

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

Richer types can also be collections.  See
[here](https://github.com/dotchain/dotjs/blob/master/test/types/defs.js)
for list definitions.

### Custom change types

DotJS comes with the ability to replace a value, splice an array or
string (i.e. delete a sub-sequence and replace that sub-sequence with
another) as well as shift a sub-sequence (in arrays or strings) to the
right or left. These are represented by the **Replace**, **Splice**
and **Move** classes
([here](https://github.com/dotchain/dotjs/tree/master/core)).

In addition, these types can be composed to form richer mutation
types. For instance when the `description` field  was replaced, it was
represented by a change at path `["description"]` using
**PathChange**:

```js
    new PathChange(["description"], new Replace(before, after)
```

Another way to combine mutations is by having a collection of changes
using **Changes**.

These types are low-level and rarely directly used. For instance, the
TextStream class directly exposes the `splice()` method.  And
replacing sub-streams automatically causes the correct `PathChange`
to be used.

Occasionally though, custom mutation types will be needed and it is
possible to define them.  There isn't an example for this yet but
hopefully, I'll add one soon.

### Network connection

The network client API simply provides a change stream that can then
be connected to the app state with bulk of the code simply not even
being aware of teh network synchronization:

```js
  // start a session
  const conn = new Conn(url, fetch);
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
`(new Session()).withPending(pending, version)`) and the new session
will continue from the point things were left at.  Note that the whole
app state would also need to be saved and used to continued.

### Network backend

The example and tests use a [pure-JS in memory
backend](https://github.com/dotchain/dotjs/blob/master/test/e2e/server.js)
which can be extended to various db solutions.  At this point, the
only existing DB solutions are via the [golang
backends](https://github.com/dotchain/dot#server) but more native JS
options will happen soon.

### Golang and Javascript interop

Much of the DOTJS platform has been written with interop in mind and
as such both the client and server can be written in either Javascript
or Golang.  But care must be used with custom types (particularly with
StructDef or ListDef) to ensure that corresponding types are
possible.  The exact procedure here needs to be documented but the
basic idea is to maintain a 1-1 correspondence between a golang struct
and the corresponding StructDef.

## Reference Documentation

The [core](core.md) classes implement values and changes.  The
streams, session and types are not yet documented.

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

The demo is a silly command line app:

* Start the server via `go run demo/server.go` (obviously requires golang)
* Run the client via `node -r esm demo/client.js`

The client currently blocks for 30s on the first call but should print
a message every second after that.

