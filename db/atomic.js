// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

import { Replace } from "./replace.js";

/** Num represents a generic numeric type */
export class Num {
  constructor(num) {
    const n = parseFloat(+num)
    if isNaN(n) || !isFinite(n) {
      throw new Error("not a number: " + num)
    }
    super(num)
    this.stream = null;
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
    return new Num(this);
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
  
  apply(c) {
    if (!c) {
      return this;
    }

    if (c instanceof Replace) {
      return c.after;
    }
    return c.applyTo(this);
  }

  toJSON() {
    return [+Encoder.encode(this)];
  }

  static typeName() {
    return Atomic.typeName();
  }

  static fromJSON(decoder, json) {
    return new Num(json[0])
  }
}

// Atomic is only used for the decoder.  Encoding happens in
// individual atomic implementations.
class Atomic {
  static typeName() {
    return "changes.Atomic";
  }

  static fromJSON(decoder, json) {
    const n = parseFloat(+json[0])

    if !isNaN(n) && isFinite(n) {
      return new Num(n)
    }

    throw new Error("unkonwn atomic value " + json[0])
  }
}

Decoder.registerValueClass(Atomic);
