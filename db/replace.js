// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "./decode.js";
import { Encoder } from "./encode.js";

/** Replace represents a change one value to another **/
export class Replace {
  /**
   * before and after must be valid Value types (that implement apply()).
   *
   * @param {Value} before - the value as it was before.
   * @param {Value} after - the value as it is after.
   */
  constructor(before, after) {
    this.before = before;
    this.after = after;
  }

  /** @returns {Replace} - the inverse of the replace */
  revert() {
    return new Replace(this.after, this.before);
  }

  _isDelete() {
    return this.after.constructor.typeName() == "changes.empty";
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
    if (other instanceof Replace) {
      return this._mergeReplace(other);
    }
    const [left, right] = other.reverseMerge(this);
    return [right, left];
  }

  _mergeReplace(other) {
    if (this._isDelete() && other._isDelete()) {
      return [null, null];
    }
    return [new Replace(this.after, other.after), null];
  }

  toJSON() {
    return Encoder.encodeArrayValue([this.before, this.after]);
  }

  static typeName() {
    return "changes.Replace";
  }

  static fromJSON(decoder, json) {
    const before = decoder.decodeValue(json[0]);
    const after = decoder.decodeValue(json[1]);
    return new Replace(before, after);
  }
}

Decoder.registerChangeClass(Replace);
