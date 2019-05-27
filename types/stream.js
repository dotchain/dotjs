// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace, Splice, Move, PathChange } from "../core/index.js";
import { Stream, Substream, ValueStream } from "../streams/index.js";

import { ListBase, ListDef } from "./list.js";
import { StructBase, StructDef } from "./struct.js";

const cache = new WeakMap();
function memoize(key, fn) {
  let result = cache.get(key);
  if (!result) {
    result = fn();
    cache.set(key, result);
  }
  return result;
}

/* makeStreamClass creates a stream class on top of the base class
 * @param {StructBase|ListBase} baseClass
 *
 * The returned class has the standard stream constructor:
 * `constructor(value, stream)` where value is an instance of the
 * provided `baseClass`.
 *
 * list streams implement: `item(index)` to fetch the element stream.
 * Methods splice, push, pop and move are also available on the stream.
 *
 * struct streams implement `<field>()` to fetch the substream for
 * each field in the struct. A setter is also available for each field.
 * The replace method replaces the whole value.
 *
 */
export function makeStreamClass(baseClass) {
  const name = baseClass.name + "Stream";
  const v = {
    [name]: class extends ValueStream {
      static create(value, stream) {
        return new this(value, stream);
      }
    }
  };
  const t = v[name];

  if (baseClass.listDef) {
    const eltCtor = baseClass.listDef()._eltCtor;
    t.prototype.item = function(idx, optCtor) {
      const result = memoize(this.value[idx], () => {
        const ctor = optCtor || (eltCtor && eltCtor.Stream) || ValueStream;
        const sub = new Substream(this.stream, [idx]);
        const streamClass = removable(ctor, baseClass);
        return new streamClass(this.value[idx], sub);
      });

      result.stream = updateSubstream(result.stream, this.stream, [idx]);
      return result;
    };

    t.prototype.splice = function(idx, removeCount, ...replacements) {
      const before = this.value.slice(idx, idx + removeCount);
      const after = this.value.constructor.from(replacements);

      // this should be super.append but can't do that because
      // this is mucking around with prototypes :(
      return this.append(new Splice(idx, before, after));
    };

    t.prototype.move = function(offset, count, distance) {
      // this should be super.append but can't do that because
      // this is mucking around with prototypes :(
      return this.append(new Move(offset, count, distance));
    };

    t.prototype.push = function(val) {
      return this.splice(this.value.length, 0, val);
    };

    t.prototype.pop = function() {
      const len = this.value.length;
      if (len === 0) {
        return null;
      }
      const value = this.value[len - 1];
      return { value, stream: this.splice(len - 1, 1) };
    };
  }

  if (baseClass.structDef) {
    for (let field of baseClass.structDef()._fields) {
      t.prototype[field._propName] = function(optCtor) {
        const sub = new Substream(this.stream, [field._fieldName]);
        const ctor =
          optCtor || (field._ctor && field._ctor.Stream) || ValueStream;
        return new ctor(field.get(this.value), sub);
      };

      const first = field._propName.charAt(0).toUpperCase();
      const setter = "set" + first + field._propName.slice(1);
      t.prototype[setter] = function(val) {
        const after = baseClass
          .structDef()
          ._replaceField(this.value, field._fieldName, val);
        const c = new Replace(this.value, after);

        // this should be super.append  but can't do that
        // because this is mucking around with prototypes
        return this.append(c);
      };
    }
  }

  return t;
}

function removable(itemStreamClass, listClass) {
  return class RemovableItem extends itemStreamClass {
    remove() {
      if (this.stream.path && this.stream.path.length) {
        const path = this.stream.path.slice(0);
        const offset = path.pop();
        const before = new listClass(this.value);
        const splice = new Splice(offset, before, new listClass());
        const c = new PathChange(path, splice);
        this.stream.parent.append(c);
      }
    }

    static create(value, stream) {
      return new this(value, stream);
    }
  };
}

function updateSubstream(original, parent, path) {
  if (original.parent === parent && arePathsEqual(path || [], original.path || [])) {
    return original;
  }
  return new Substream(parent, path);
}

function arePathsEqual(p1, p2) {
  const l = PathChange.commonPrefixLen(p1, p2);
  return l === p1.length && l === p2.length;
}

