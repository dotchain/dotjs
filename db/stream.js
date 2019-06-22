// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

/**
 * Stream tracks all future changes to a particular value.
 *
 * Use the next property to check if there is a subsequent change.
 *
 * The next property is null if there is no further change yet. It is
 * an object `{change, version}` where change refers to the actual
 * change and version refers to the next stream instance (with its own
 * next field if there are further changes).
 *
 * The whole stream is effectively immutable with the next field only
 * ever getting written to once when a new version happens. If more
 * changes are made on the current stream, those versions are tacked
 * on at the end of the next version (with the changes appropriately
 * factoring all other changes),
 *
 * Streams are convergent: chasing the next pointer of any stream
 * instance in a particular stream will converge (i.e applying the
 * changes will end up with same value even if the changes themselves
 * are a little different).
 *
 */
export class Stream {
  constructor() {
    this.next = null;
  }

  /* push commits any changes upstream */
  push() {
    return this;
  }

  /* pull fetches any upstream changes which will be avilable via next */
  pull() {
    return this;
  }

  /* undo reverts the last change on the underlying stream which could
   * be a parent stream. The last change may not really affect the
   * current stream directly.
   *
   * Normal streams do not support undo but a stream created via
   *`undoable` (and all its descendant streams/sub-streams) support
   * undo.
   */
  undo() {
    return this;
  }

  /* redo reapplies the last change that got reverted by undo */
  redo() {
    return this;
  }

  /* append adds a local change */
  append(c) {
    return this._appendChange(c, false);
  }

  /* reverseAppend adds an *upstream* change; meant to be used by nw
   * synchronizers */
  reverseAppend(c) {
    return this._appendChange(c, true);
  }

  _appendChange(c, reverse) {
    const result = new Stream();
    let s = this;
    let nexts = result;
    while (s.next !== null) {
      let { change, version } = s.next;
      s = version;

      [c, change] = this._merge(change, c, reverse);
      nexts.next = { change, version: new Stream() };
      nexts = nexts.next.version;
    }
    s.next = { change: c, version: nexts };
    return result;
  }

  _merge(left, right, reverse) {
    if (left === null || right === null) {
      return [right, left];
    }

    if (!reverse) {
      return left.merge(right);
    }

    [right, left] = right.merge(left);
    return [left, right];
  }
}
