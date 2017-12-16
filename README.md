# dotjs
ES6 Client library for [DOT](https://github.com/rameshvk/dot)

## Coding practices

1. Code within this library cannot have any external dependencies (though dev dependencies is ok).
2. Client library code is within the client folder. 
3. Each file in the client folder must use ES6.  It must export a builder which is function which returns a class. It cannot import any file -- if it depends on a class from another file, it simply uses the services hash to get it.
4. The demo code and associated UX is in the demo folder.
5. Tests are in the test folder. All tests should run by invoking npm test.
6. No setup should be required for tests or demo beyond `npm install`

## Demo

This is in progress.  A working demo should use a hosted heroku instance when done.
