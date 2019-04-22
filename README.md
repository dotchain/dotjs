# dotjs

[![Build Status](https://travis-ci.com/dotchain/dotjs.svg?branch=master)](https://travis-ci.com/dotchain/dotjs)
[![codecov](https://codecov.io/gh/dotchain/dotjs/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/dotjs)

Distributed synchronization using Operations Trannsformations

## Status

This ES6 package is a port of the [Go implementation](https://github.com/dotchain/dot) that should fully interoperate with that version.

This is in the beginning stages of the port, with the following plan:

1. Port core dot/changes
2. Port core dot/changes/types
3. Port core dot/streams
4. Implement ops but only client-side version
5. Implement demo app

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
