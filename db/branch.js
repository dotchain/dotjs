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
  return new BranchStream(child, { parent: s, child });
}

class BranchStream {
  constructor(parent, info) {
    this.parent = parent;
    this.info = info;
  }

  push() {
    const info = this.info;
    for (let next = info.child.next; next; next = info.child.next) {
      const { change, version } = next;
      info.parent = info.parent.append(change).version;
      info.child = version;
    }

    return null;
  }

  pull() {
    const info = this.info;
    for (let next = info.parent.next; next != null; next = info.parent.next) {
      const { change, version } = next;
      info.child = info.child.reverseAppend(change).version;
      info.parent = version;
    }

    return null;
  }

  get next() {
    return this._nextf(this.parent.next);
  }

  append(c) {
    return this._nextf(this.parent && this.parent.append(c));
  }

  reverseAppend(c) {
    return this._nextf(this.parent && this.parent.reverseAppend(c));
  }

  _nextf(n) {
    if (!n) {
      return null;
    }
    const version = new BranchStream(n.version, this.info);
    return { change: n.change, version };
  }

  undo() {
    return this.parent.undo();
  }

  redo() {
    return this.parent.redo();
  }
}
