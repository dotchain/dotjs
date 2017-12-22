# dotjs

[![Build Status](https://travis-ci.org/dotchain/dotjs.svg?branch=master)](https://travis-ci.org/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

ES6 Client library for [DOT](https://github.com/rameshvk/dot)

## Installation

There is no plan to make this code available via NPM.  The suggested way to use this library is by adding the following to your package.json and using it.

```
yarn add git://github.com/dotchain/dotjs
```

or

```
npm install git://github.com/dotchain/dotjs
```

## API Draft

The unit of granularity of synchronization is a `model`.  Other
similar systems refer to it as a `document`.  The `model` can be any
JSON object made of arrays and maps, with incremental edits of arrays
and strings handled via the API.

### Creating the client

```js
   const client = new dotjs.Client(mapper)
```

The mapper is a function that takes a `modelID` as a parameter and
returns the websocket URL which implements the [Log
Protocol](http://github.com/dotchain/dots).

### Iniitalizing a model

```js
   client.subscribe(subID, modelID, done)
```

The `subID` is an ID that uniquely tracks this subscription.  It is
used to tear down the model when it is no longer needed.

The `modelID` is the ID of the model.  The `done` callback is called
when the model is ready for edits.

There is no explicit step to create models.  The first edit of a model
effectively creates it.

## Tear down of a model

The `unsubscribe` call stops synching the model.  Note that a detached
model should not be modified.

## Modifying a model

The `client` object exposes an `apply` method.

```js
   client.apply('localChange', 0, {
       Path: [modelID, key,...],
       Set: {Key: 'hello', Before: 'x', After: 'Scotty'},
   });
```

The third parameter is the interesting `change` description which has
a path where the change happens and the actual change itself (which
can be `Set{Key, Before, After}` or `Splice{Offset, Before, After}` or
`Move{Offset,Count,Distance}` or `Range`.  Please see
[Operations](http://github.com/dotchains/site/Operations.md) for a
better understanding of what these mean.

## Fetching the current value

The `client` object also exposes a `getValue` method which takes a
path and returns the value at that path.

```js
   const x = client.getValue([modelID, key...]);
```

## Changes

It is possible to watch all the changes by subscribing to
`client.events`. There are two events:

    Client emits two events:
        localChange has event data = {change, index, before, after}
        remoteChange has event data = {change, index, before, after}
    
    The actual change is either an array or a single value JSON
    structure that represents the change (as per the spec in
    https://github.com/dotchain/site/Operation.md).  The index
    refers to the first valid index in change.Path.
    
    Change paths are arrays of strings referring to where in the
    JSON model the change happened.  Client tacks on the modelID on
    top of it, so someone can watch for all client changes via this
    mechanism.
    
    The before and after fields do not point the before and after
    of the client (which being a singleton is not as useful).
    Instead, the before/after refer to the ModelManager managing
    the model where the change happened.

## Coding practices

1. Code within this library generally cannot have any external dependencies (though dev dependencies is ok). It definitely cannot `import` or `require` stuff but see #3 below
2. Client library code is within the client folder. 
3. Each file in the client folder must use ES6.  It must export a builder which is function which returns a class. It cannot import any file -- if it depends on a class from another file, it simply uses the services hash to get it.  External dependences must also be injected this way by the caller (so the caller can choose whether to bring in more files or not).
4. The demo code and associated UX is in the demo folder.
5. Tests are in the test folder. All tests should run by invoking npm test.
6. No setup should be required for tests or demo beyond `npm install`

The main benefit of this approach is that individual source files can be neatly tested by using the injection pattern but a secondary benefit is that consumers of this can opt to selectively include just some files or provide alternate implementations for parts of it.

## Demo

This is in progress.  A working demo should use a hosted heroku instance when complete. Meanwhile, here are the manual steps.

The demo server is built in [Go](https://golang.org) on top of [dots](https://github.com/dotchain/dots).

1. Install Go
2. Install dependencies: `go get -u https://github.com/dotchain/dots`
3. Start server `go run demo/server.go` (which uses storage folder to store log files)
4. Go to browser and party `http://localhost:8181/x`

