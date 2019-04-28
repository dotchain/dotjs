// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { Splice } from "./splice.js";
import { PathChange } from "./path_change.js";
import { Encoder } from "./encode.js";

// List represents a collection
export class List {
  constructor(entries) {
    this.entries = entries || [];
  }

  slice(start, end) {
    return new List(this.entries.slice(start, end));
  }

  concat(otherList) {
    return new List(this.entries.concat(otherList.entries));
  }

  get length() {
    return this.entries.length;
  }

  get(idx) {
    return this.entries[idx];
  }

  set(idx, val) {
    const slice = this.entries.slice(0);
    slice[idx] = val;
    return new List(slice);
  }

  apply(c) {
    return applyList(this, c);
  }

  toJSON() {
    return Encoder.encodeArrayValue(this.entries);
  }

  static typeName() {
    return "changes/types.A";
  }

  static fromJSON(decoder, json) {
    return new List((json || []).map(x => decoder.decodeValue(x)));
  }
}

// applyList implements apply() for list-like objects which have
// get, set, slice and concat methods
export function applyList(obj, c) {
  if (c == null) {
    return obj;
  }

  if (c instanceof Replace) {
    return c.after;
  }

  if (c instanceof PathChange) {
    if (c.path === null || c.path.length === 0) {
      return obj.apply(c.change);
    }
    const pc = new PathChange(c.path.slice(1), c.change);
    return obj.set(c.path[0], obj.get(c.path[0]).apply(pc));
  }

  if (c instanceof Splice) {
    const left = obj.slice(0, c.offset);
    const right = obj.slice(c.offset + c.before.length);
    return left.concat(c.after).concat(right);
  }

  return c.applyTo(obj);
}
