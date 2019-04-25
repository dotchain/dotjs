// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

export class Stream {
  constructor() {
    this.nextChange = null;
    this.nextInstance = null;
  }

  append(c) {
    return this._appendChange(c, false);
  }

  reverseAppend(c) {
    return this._appendChange(c, true);
  }

  _appendChange(c, reverse) {
    const result = new Stream();
    let next = result;
    let s = this;
    while (s.nextInstance !== null) {
      [c, next.nextChange] = this._merge(s.nextChange, c, reverse);
      s = s.nextInstance;
      next.nextInstance = new Stream();
      next = next.nextInstance;
    }
    [s.nextChange, s.nextInstance] = [c, next];
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
