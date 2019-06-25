// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { branch } from "./branch.js";

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

  _nextf(change, version) {
    const v = this.apply(change);
    v.stream = version;
    return { change, version: v };
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
    const result = this.clone();
    result.stream = branch(this.stream);
    return result;
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
