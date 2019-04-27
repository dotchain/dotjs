# Convergent streams in Dot.js

Much of the API surface in Dot.js is exposed via the idea of
convergent streams. Convergent streams allow implementing a
distributed convergent system in an almost pure function and reactive
way.

## Stream definition

A stream captures the idea of a value that changes with time and so it
exposes a `next` property which should have the shape `{change,
version}`.

```js

class MinimalStreamImplementation {
  get next() {
    const change = this._change;
    const version = this._version;
    return {change, version};
  }
}
```

A stream instance always tracks a future version. This allows for
garbage collection to proceed naturally.  Holding onto previous
versions will force all older versions to reside in memory even if
they are not used and effectively be like a leak.

## Value stream vs change streams

The `dotjs.Stream` class implements a simple **change stream** which
does not have an associated value and only tracks the change
itself. But it is also possible to track the value as illustrated in
the
[dotjs.StringStream](https://github.com/dotchain/dotjs/blob/master/streams/string.js)
class.

All value streams expose the **current** value via the `value`
property (which can be an actual dynamic property if lazy calculations
are involved).

## Mutation and convergence

Stream instances are *almost* **immutable**. Mutation methods (such as
`StringStream.replace`) return a new stream instance.

The original is almost unchanged: if it didn't have a next field, its
`next` property will now reflect the current change.  If it does have
a change, the `next` property itself is not modified.  Instead the
`next` chain is walked until the end and the change is tacked on
there.

The change that gets tacked on may not be the original change
though as it has to account for all the existing `next` values. This
is done through OT and is the heart of the package but for the
purposes of this dicussion, the essential guarantee is that both the
old and the new instance retain their expected values but chasing the
`next` pointers effectively will cause both to have the same value:

```js

const initial = new dotjs.StringStream("heya");

const first = initial.replace("howdy");
const second = initial.replace("boo");

// now all three should have converged:
expect(initial.latest().value).to.equal(first.latest().value);
expect(initial.latest().value).to.equal(second.latest().value);

```

## Network streams

The network synchronization (via
[dotjs.Session](https://github.com/dotchain/dotjs/blob/master/session/session.js))
works on top of streams with the ability to `push()` local
changes on the stream up to the network and `pull()` remote changes
from the network to the stream.

## Composition: derived streams

The reactive part of using streams is the ability to compose streams:

```js

function combine(s1, s2, mergeFn) {
  return {
     value:  mergeFn(s1.value, s2.value),
     get next() {
        if (s1.next !== null) {
          return combine(s1.next.version, s2, mergeFn);
        }
        if (s2.next !== null) {
          return combine(s1, s2.next.version, mergeFn);
        }
        return null;
     }
  }
}
```

The above example combines streams in a reactive way, always applying
the `mergeFn` with any change. This is ineffecient in some cases where
one can do better by looking at the change itself.  For example, if
one were only filtering for some keys in a map, we can ignore changes
that affect other keys:

```js

function withKeys(s1, validKeys) {
  return withKeysValue(s1, _.pick(s1.value, validKeys), validKeys);
}

function withKeysValue(s1, value, validKeys) {
   return {
      value,
      get next() {
         if (s1.next == null) {
            return null;
         }
         const c = s1.next.change;
         if (c instanceof PathChange) {
            if (c.path !== null && !_.includes(validKeys, c.path[0])) {
               // not relevant path
               return withKeysValue(s1.next.version, value, validKey);
            }
         }
         // default: recalculate
         return withKeys(s1.next.version, validKeys);
      }
   }
}
```

Note: the example above is just an illustration.  The performance
impact of redoing the calculation is generally not much and so most
composition can simply be fully reactive.

## Derived streams and mutability

Most of the base streams provide update methods -- at the very minimum
the ability to replace the value with another.  In a lot of cases,
derived streams also have meaningful mutation capabilities.  For
example, even with a filtered stream, it make sense to support appends
or additions.

Consider an example of a stream representing an object of two fields A
and B. The sub-stream for B can be derived from that of the root
object and effectively should support all mutations that B itself
provides.

The
[dotjs.Substream](https://github.com/dotchain/dotjs/blob/master/streams/substream.js)
function is a useful helper that maps changes back forth. This works
on change streams though, so the value methods would still need to be
wrapped up.
