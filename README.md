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
3. Implement operations but only the client-side of it. ** In Progress **
4. Implement a browser demo against golang backend.
5. Implement JS server version with golang front-end tests for interop.
6. Implement array operations and basic array types.
7. Implement refs.
8. Implement streams for array elements.
9. Update demos.
10. Implement string JS types.
12. Update demos.

All other functionality will be part of v2 (including refs and such)

## Installation

There is no plan to make this code available via NPM.  The suggested way to use this library is by adding the following to your package.json and using it.

```
yarn add git://github.com/dotchain/dotjs
```

or

```
npm install git://github.com/dotchain/dotjs
```

