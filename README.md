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

## API Documentation

Please see the generated [JSDoc](https://dotchain.github.io/dotjs/out/).

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

