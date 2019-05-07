// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Stream } from "./stream.js";

/**
 * branch creates a branched stream.  Updates to the returned branched
 * stream or the parent stream are not automatically carried over to
 * each other.  Instead, returned branch stream implements push() and
 * pull() to do this on demand.
 *
 * @param {Stream} s - parent stream
 * @returns {Stream}
 */
export function branch(s) {
  const child = new Stream();
  return new Branch({ parent: s, child }, child);
}

class Branch {
  constructor(info, underlying) {
    this._info = info;
    this._underlying = underlying;
  }

  push() {
    const info = this._info;
    for (let next = info.child.next; next != null; next = info.child.next) {
      const { change, version } = next;
      info.parent = info.parent.append(change);
      info.child = next.version;
    }

    return this;
  }

  pull() {
    const info = this._info;
    for (let next = info.parent.next; next != null; next = info.parent.next) {
      const { change, version } = next;
      info.child = info.child.reverseAppend(change);
      info.parent = next.version;
    }

    return this;
  }

  get next() {
    const n = this._underlying.next;
    return n === null
      ? null
      : { change: n.change, version: new Branch(this._info, n.version) };
  }

  append(c) {
    return new Branch(this._info, this._underlying.append(c));
  }

  reverseAppend(c) {
    return new Branch(this._info, this._underlying.reverseAppend(c));
  }

  undo() {
    this._underlying.undo();
    return this;
  }

  redo() {
    this._underlying.redo();
    return this;
  }
}
