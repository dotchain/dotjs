// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Replace } from "./replace.js";
import { PathChange } from "./path_change.js";
import { Decoder } from "./decode.js";

/**
 * Splice represents the change to replace a sub-sequence with another.
 * It can be used with strings or array-like values.
 */
export class Splice {
  /**
   * @param {Number} offset -- where the sub-sequence starts.
   * @param {Value} before -- the subsequnce as it was before.
   * @param {Value} value - the subsequence as it is after.
   */
  constructor(offset, before, after) {
    this.offset = offset;
    this.before = before;
    this.after = after;
  }

  revert() {
    return new Splice(this.offset, this.after, this.before);
  }

  reverseMerge(other) {
    if (other == null) {
      return [null, this];
    }
    if (other instanceof Replace) {
      return this._mergeReplace(other);
    }

    if (other instanceof Splice) {
      const [left, right] = other._mergeSplice(this);
      return [right, left];
    }

    if (other instanceof PathChange) {
      return this._mergePath(other, true);
    }

    const [self, otherx] = other.reverseMerge(this);
    return [otherx, self];
  }

  merge(other) {
    if (other == null) {
      return [null, this];
    }

    if (other instanceof Replace) {
      return this._mergeReplace(other);
    }

    if (other instanceof Splice) {
      return this._mergeSplice(other);
    }

    if (other instanceof PathChange) {
      return this._mergePath(other, false);
    }
    const [left, right] = other.reverseMerge(this);
    return [right, left];
  }

  _mergePath(o, reverse) {
    if (o.path == null || o.path.length === 0) {
      if (reverse) {
        return this.reverseMerge(o.change);
      }
      return this.merge(o.change);
    }

    const newPath = this.mapPath(o.path);
    if (newPath == null) {
      const p = [o.path[0] - this.offset].concat(o.path.slice(1));
      const before = this.before.apply(new PathChange(p, o.change));
      return [null, new Splice(this.offset, before, this.after)];
    }
    return [new PathChange(newPath, o.change), this];
  }

  mapPath(path) {
    const idx = path[0];
    if (idx < this.offset) {
      return path;
    }

    if (idx >= this.offset + this.before.length) {
      const idx2 = idx + this.after.length - this.before.length;
      return [idx2].concat(path.slice(1));
    }

    // path obliterated
    return null;
  }

  _mergeSplice(o) {
    if (Splice._end(this) <= o.offset) {
      // [ ] < >
      const offset = o.offset + Splice._diff(this);
      const other = new Splice(offset, o.before, o.after);
      return [other, this];
    }

    if (Splice._end(o) <= this.offset) {
      // < > [ ]
      const offset = this.offset + Splice._diff(o);
      const updated = new Splice(offset, this.before, this.after);
      return [o, updated];
    }

    if (this.offset < o.offset && Splice._end(this) < Splice._end(o)) {
      // [ < ] >
      const oOffset = this.offset + this.after.length;
      const end = Splice._end(this);
      const oBefore = o.before.slice(end - o.offset, o.before.length);
      const before = this.before.slice(0, o.offset - this.offset);
      return [
        new Splice(oOffset, oBefore, o.after),
        new Splice(this.offset, before, this.after)
      ];
    }

    if (this.offset == o.offset && this.before.length < o.before.length) {
      // <[ ] >
      const oBefore = o.before.slice(this.before.length, o.before.length);
      const oOffset = o.offset + this.after.length;
      const other = new Splice(oOffset, oBefore, o.after);

      return [
        other,
        new Splice(this.offset, this.before.slice(0, 0), this.after)
      ];
      // golang behavior is below
      // const oBefore = o.before.apply(new Splice(0, this.before, this.after));
      // return [new Splice(o.offset, oBefore, o.after), null];
    }

    if (this.offset <= o.offset && Splice._end(this) >= Splice._end(o)) {
      // [ < > ]
      const diff = o.offset - this.offset;
      const slice = this.before.slice(diff, diff + o.before.length);
      const before = this.before.apply(new Splice(diff, slice, o.after));
      return [null, new Splice(this.offset, before, this.after)];
    }

    if (this.offset > o.offset && Splice._end(this) <= Splice._end(o)) {
      // < [ ]>
      const diff = this.offset - o.offset;
      const slice = o.before.slice(diff, diff + this.before.length);
      const oBefore = o.before.apply(
        new Splice(this.offset - o.offset, slice, this.after)
      );
      return [new Splice(o.offset, oBefore, o.after), null];
    }

    // < [ > ]
    const oBefore = o.before.slice(0, this.offset - o.offset);
    const offset = o.offset + o.after.length;
    const before = this.before.slice(
      Splice._end(o) - this.offset,
      this.before.length
    );
    return [
      new Splice(o.offset, oBefore, o.after),
      new Splice(offset, before, this.after)
    ];
  }

  _mergeReplace(other) {
    const after = other.before.apply(this);
    return [new Replace(after, other.after), null];
  }

  toJSON() {
    return [
      this.offset,
      Encoder.encode(this.before),
      Encoder.encode(this.after)
    ];
  }

  static typeName() {
    return "changes.Splice";
  }

  static fromJSON(decoder, json) {
    const before = decoder.decodeValue(json[1]);
    const after = decoder.decodeValue(json[2]);
    return new Splice(json[0], before, after);
  }

  static _end(s) {
    return s.offset + s.before.length;
  }

  static _diff(s) {
    return s.after.length - s.before.length;
  }
}

Decoder.registerChangeClass(Splice);
