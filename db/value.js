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
    this._next = null;
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
    return this.appendChange(new Replace(this.clone(), replacement.clone()))
      .version;
  }

  /**
   * appendChange applies a change to the value and the underlying stream
   * It returns a {change, version} tuple much like next does.
   */
  appendChange(c) {
    if (!this.stream) {
      return this.apply(c).clone();
    }
    const n = this.stream.append(c);
    if (!n) {
      return this;
    }
    return this._nextf(n.change, n.version);
  }

  /** @type {Object} null or {change, version} */
  get next() {
    if (this._next !== null || !this.stream) {
      return this._next;
    }

    let n = this.stream.next;
    for (; n && !n.change; n = n.version.next) {
      // the following *mutation* is not strictly needed but improves
      // performance when an value is referred to by multiple derived
      // computations. it also helps better garbage collection of streams
      this.stream = n.version;
    }

    if (!n) return null;
    this._next = this._nextf(n.change, n.version);
    return this._next;
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
    return {
      change,
      version: this.apply(change)
        .clone()
        .setStream(version)
    };
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
    return this.stream && this.stream.push();
  }

  /** pull pulls changes from the parent */
  pull() {
    return this.stream && this.stream.pull();
  }

  /** undoes the last change on this branch */
  undo() {
    return this.stream && this.stream.undo();
  }

  /** redoes the last undo on this branch */
  redo() {
    return this.stream && this.stream.redo();
  }
}
