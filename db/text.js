// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { Splice } from "./splice.js";
import { Move } from "./move.js";

/** Text represents a string value */
export class Text {
  constructor(text) {
    this.text = (text || "").toString();
    this.stream = null;
  }

  slice(start, end) {
    return new Text(this.text.slice(start, end));
  }

  get length() {
    return this.text.length;
  }

  /**
   * splice splices a replacement string (or Text)
   *
   * @param {Number} offset - where the replacement starts
   * @param {Number} count - number of characters to remove
   * @param {Text|String} replacement - what to replace with
   *
   * @return {Text}
   */
  splice(offset, count, replacement) {
    if (!(replacement instanceof Text)) {
      replacement = new Text(replacement)
    }

    const before = this.slice(offset, offset+count);
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
  
  /** 
   * replace substitutes this with another value 
   * @returns {Value} r - r has same stream as this
   **/
  replace(replacement) {
    const change = new Replace(this.clone(), replacement.clone());
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Text(this.text);
  }

  /** @type {Object} null or {change, version} */
  get next() {
    const n = this.stream && this.stream.next;
    if (!n) return null;
    return this._nextf(n.change, n.version);
  }

  _nextf(change, version) {    
    const v = this.apply(change);
    if (v.hasOwnProperty("stream")) v.stream = version;
    return {change, version: v};
  }
    
  /**
   * Apply any change immutably.
   * @param {Change} c -- any change; can be null.
   * @returns {Value}
   */
  apply(c) {
    if (!c) {
      return this;
    }

    if (c instanceof Replace) {
      return c.after;
    }

    if (c instanceof Splice) {
      const left = this.text.slice(0, c.offset);
      const right = this.text.slice(c.offset + c.before.length);
      return new Text(left + c.after.text + right);
    }

    if (c instanceof Move) {
      let { offset: o, distance: d, count: cx } = c;
      if (d < 0) {
        [o, cx, d] = [o + d, -d, cx];
      }

      const s1 = this.text.slice(0, o);
      const s2 = this.text.slice(o, o + cx);
      const s3 = this.text.slice(o + cx, o + cx + d);
      const s4 = this.text.slice(o + cx + d);
      return new Text(s1 + s3 + s2 + s4);
    }

    return c.applyTo(this);
  }

  toJSON() {
    return this.text;
  }

  static typeName() {
    return "changes/types.S16";
  }

  static fromJSON(decoder, json) {
    return new Text(json);
  }
}
