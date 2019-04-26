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
4. Implement a browser demo against golang backend. ** In progress **
5. Implement array operations and basic array types.
6. Implement session with local transformations
7. Implement streams for array elements.
8. Update demos.
9. Implement string JS types.
10. Update demos.
11. Implement JS server version with golang front-end tests for interop.

## Installation

There is no plan to make this code available via NPM.  The suggested way to use this library is by adding the following to your package.json and using it.

```
yarn add git://github.com/dotchain/dotjs
```

or

```
npm install git://github.com/dotchain/dotjs
```

## Demo

Running the demo requires starting the server:

```sh
$> go run demo/server.go
```

And then, starting a client:

```sh
$> node -r esm demo/client.js
```

The client currently blocks for 30s on the first call but should print
a message every second after that.  Not a very practical demo but good
enough to validate that things work E2E.

