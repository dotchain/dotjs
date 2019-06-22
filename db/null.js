// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";

/** Null represents an empty value */
export class Null {
  constructor() {
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
    return new Null();
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
    return [];
  }

  static typeName() {
    return "changes.empty";
  }

  static fromJSON() {
    return new Null();
  }
}

