// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { Splice } from "./splice.js";
import { PathChange } from "./path_change.js";
import { Encoder } from "./encode.js";
import { Move } from "./move.js";
import { Value } from "./value.js";
import { Substream } from "./substream.js";
import { Decoder } from "./decode.js";

/** Seq represents a sequence of values */
export class Seq extends Value {
  constructor(entries) {
    super();
    this.entries = entries || [];
  }

  /**
   * splice splices a replacement sequence
   *
   * @param {Number} offset - where the replacement starts
   * @param {Number} count - number of items to remove
   * @param {Text|String} replacement - what to replace with
   *
   * @return {Text}
   */
  splice(offset, count, replacement) {
    const before = this.slice(offset, offset + count);
    const change = new Splice(offset, before, replacement);
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /**
   * move shifts the sub-sequence by the specified distance.
   * If distance is positive, the sub-sequence shifts over to the
   * right by as many characters as specified in distance. Negative
   * distance shifts left.
   *
   * @param {Number} offset - start of sub-sequence to shift
   * @param {Number} count - size of sub-sequence to shift
   * @param {Number} distance - distance to shift
   *
   * @return {Text}
   */
  move(offset, count, distance) {
    const change = new Move(offset, count, distance);
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Seq(this.entries);
  }

  slice(start, end) {
    return new Seq(this.entries.slice(start, end));
  }

  _concat(...args) {
    const entries = [];
    for (let arg of args) {
      entries.push(arg.entries);
    }
    return new Seq(this.entries.concat(...entries));
  }

  get length() {
    return this.entries.length;
  }

  get(idx) {
    const v = this.entries[idx];
    if (v) {
      return v.setStream(new Substream(this.stream, idx));
    }
    // this is disconneected!
    return new Null();
  }

  set(idx, val) {
    const slice = this.entries.slice(0);
    slice[idx] = val;
    return new Seq(slice);
  }

  apply(c) {
    return applySeq(this, c);
  }

  toJSON() {
    return Encoder.encodeArrayValue(this.entries);
  }

  static typeName() {
    return "dotdb.Seq";
  }

  static fromJSON(decoder, json) {
    return new Seq((json || []).map(x => decoder.decodeValue(x)));
  }
}

Decoder.registerValueClass(Seq);

// applySeq implements apply() for list-like objects which have
// get, set, slice and concat methods
export function applySeq(obj, c) {
  if (c == null) {
    return obj.clone();
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
    return left._concat(c.after, right);
  }

  if (c instanceof Move) {
    let { offset: off, count, distance: dist } = c;
    if (dist < 0) {
      [off, count, dist] = [off + dist, -dist, count];
    }
    const l1 = obj.slice(0, off);
    const l2 = obj.slice(off, off + count);
    const l3 = obj.slice(off + count, off + count + dist);
    const l4 = obj.slice(off + count + dist);
    return l1._concat(l3, l2, l4);
  }

  return c.applyTo(obj);
}
