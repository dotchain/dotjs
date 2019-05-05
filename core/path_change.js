// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Replace } from "./replace.js";

/** PathChange represents an embedded value changing at the specified path. */
export class PathChange {
  /**
   * The path is a sequence of index or key name to refer to the embeded value.
   *
   * Example: root.rows[3] will have path ["rows", 3].
   *
   * @param {Any[]} path - path to inner value.
   * @param {Change} change - any change applied to inner value at path.
   */
  constructor(path, change) {
    if (path == undefined) {
      path = null;
    }
    if (change === undefined) {
      change = null;
    }

    this.path = path;
    this.change = change;
  }

  /** @returns {Change} - the inverse of this change */
  revert() {
    if (this.change == null) {
      return null;
    }

    return PathChange.create(this.path, this.change.revert());
  }

  reverseMerge(other) {
    if (this.path === null || this.path.length === 0) {
      const [left, right] = other.merge(this.change);
      return [right, left];
    }

    if (other instanceof Replace) {
      const before = other.before.apply(this);
      return [new Replace(before, other.after), null];
    }
    throw new Error("unexpected PathChange.reverseMerge");
  }

  /**
   * Merge another change and return modified version of
   * the other and current change.
   *
   * current + returned[0] and other + returned[1] are guaranteed
   * to result in the same state.
   *
   * @returns {Change[]}
   */
  merge(other) {
    if (other == null) {
      return [null, this];
    }

    if (this.change == null) {
      return [other, null];
    }

    if (this.path == null) {
      return this.change.merge(other);
    }

    if (!(other instanceof PathChange)) {
      other = new PathChange(null, other);
    }

    const len = PathChange.commonPrefixLen(this.path, other.path);
    const ownLen = (this.path && this.path.length) || 0;
    const otherLen = (other.path && other.path.length) || 0;

    if (len != ownLen && len != otherLen) {
      return [other, this];
    }

    if (len == ownLen && len == otherLen) {
      const [left, right] = this.change.merge(other.change);
      return [
        PathChange.create(other.path, left),
        PathChange.create(this.path, right)
      ];
    }

    if (len == ownLen) {
      const [left, right] = this.change.merge(
        PathChange.create(other.path.slice(len), other.change)
      );
      return [
        PathChange.create(this.path, left),
        PathChange.create(this.path, right)
      ];
    }

    const [left, right] = other.merge(this);
    return [right, left];
  }

  applyTo(value) {
    if (this.path === null || this.path.length === 0) {
      return value.apply(this.change);
    }
    throw new Error("Unexpected use of PathChange.applyTo");
  }

  toJSON() {
    const path = Encoder.encodeArrayValue(this.path);
    return [path, Encoder.encode(this.change)];
  }

  static typeName() {
    return "changes.PathChange";
  }

  static fromJSON(decoder, json) {
    let path = json[0];

    if (path !== null) {
      path = path.map(x => decoder.decode(x));
    }

    const change = decoder.decodeChange(json[1]);
    return new PathChange(path, change);
  }

  static commonPrefixLen(p1, p2) {
    if (p1 == null || p2 == null) {
      return 0;
    }
    let len = 0;
    for (; len < p1.length && len < p2.length; len++) {
      const encode = x => Encoder.encode(x);
      if (JSON.stringify(encode(p1[len])) != JSON.stringify(encode(p2[len]))) {
        return len;
      }
    }
    return len;
  }

  static create(path, change) {
    if (path == null || path.length == 0) {
      return change;
    }
    if (change == null) {
      return null;
    }
    if (change instanceof PathChange) {
      const otherPath = change.path || [];
      return this._pc(path.concat(otherPath), change.change);
    }
    return new PathChange(path, change);
  }
}
