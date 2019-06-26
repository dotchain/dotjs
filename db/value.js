// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { branch } from "./branch.js";
import { Changes } from "./changes.js";

/** Value is the base class for values.
 *
 * It should not be used directly but by subclassing.
 * Subclasses should implement clone(), toJSON(), static typeName() as
 * well as static fromJSON and optionally override apply().
 */
export class Value {
  constructor() {
    this.stream = null;
  }

  /** setStream mutates the current value and updates it stream **/
  setStream(s) {
    this.stream = s;
    return this;
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

  /** @type {Object} null or {change, version} */
  get next() {
    const n = this.stream && this.stream.next;
    if (!n) return null;
    return this._nextf(n.change, n.version);
  }

  /** latest returns the latest version */
  latest() {
    let result = this;
    for (let n = this.next; n; n = result.next) {
      result = n.version;
    }
    return result;
  }

  _nextf(change, version) {
    return { change, version: this.apply(change).setStream(version) };
  }

  /** default apply only supports Replace */
  apply(c) {
    if (!c) {
      return this.clone();
    }

    if (c instanceof Replace) {
      return c.after;
    }

    return c.applyTo(this);
  }

  /** branch returns a value that is on its own branch with push/pull support **/
  branch() {
    return this.clone().setStream(branch(this.stream));
  }

  /** push pushes the changes up to the parent */
  push() {
    if (this.stream) {
      this.stream.push();
    }
    return this;
  }

  /** pull pulls changes from the parent */
  pull() {
    if (this.stream) {
      this.stream.pull();
    }
    return this;
  }

  /** undoes the last change on this branch */
  undo() {
    if (this.stream) {
      this.stream.undo();
    }
    return this;
  }

  /** redoes the last undo on this branch */
  redo() {
    if (this.stream) {
      this.stream.redo();
    }
    return this;
  }
}
