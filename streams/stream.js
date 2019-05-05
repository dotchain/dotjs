// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

export class Stream {
  constructor() {
    this.next = null;
  }

  push() {
    return this;
  }

  pull() {
    return this;
  }

  undo() {
    return this;
  }

  redo() {
    return this;
  }

  append(c) {
    return this._appendChange(c, false);
  }

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
