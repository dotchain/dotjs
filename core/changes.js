// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";

// Changes represents a collection of changes
export class Changes {
  constructor(...changes) {
    this._all = [];
    for (let cx of changes) {
      if (cx instanceof Changes) {
        cx = cx._all;
      }
      if (!Array.isArray(cx)) {
        cx = [cx];
      }
      for (let c of cx) {
        this._all.push(c);
      }
    }
  }

  revert() {
    let result = [];
    for (let kk = this._all.length - 1; kk >= 0; kk--) {
      const c = this._all[kk] && this._all[kk].revert();
      if (c) {
        result.push(c);
      }
    }
    return Changes.create(result);
  }

  merge(other) {
    if (other == null) {
      return [null, this];
    }

    let result = [];
    for (let c of this._all) {
      if (c !== null) {
        [other, c] = c.merge(other);
      }
      if (c !== null) {
        result.push(c);
      }
    }
    return [other, Changes.create(result)];
  }

  reverseMerge(other) {
    if (other == null) {
      return [null, this];
    }

    let result = [];
    for (let c of this._all) {
      if (other != null) {
        [c, other] = other.merge(c);
      }
      if (c !== null) {
        result.push(c);
      }
    }
    return [other, Changes.create(result)];
  }

  applyTo(value) {
    for (let c of this._all) {
      value = value.apply(c);
    }
    return value;
  }

  *[Symbol.iterator]() {
    for (let c of this._all) {
      yield c;
    }
  }

  toJSON() {
    return Encoder.encodeArrayValue(this._all);
  }

  static typeName() {
    return "changes.ChangeSet";
  }

  static fromJSON(decoder, json) {
    if (json) {
      json = json.map(elt => decoder.decodeChange(elt));
    }
    return Changes.create(json);
  }

  static create(elts) {
    return (elts && elts.length && new Changes(elts)) || null;
  }
}
