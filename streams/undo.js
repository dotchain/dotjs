// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Changes } from "../core/index.js";
import { Stream } from "./stream";

export function undoable(s) {
  const info = { changes: [], s };
  return new Undo(info, s);
}

class Undo {
  constructor(info, underlying) {
    this._info = info;
    this._underlying = underlying;
  }

  push() {
    this._underlying.push();
    return this;
  }

  pull() {
    Undo._syncInfo(this._info, "local");
    this._underlying.pull();
    Undo._syncInfo(this._info, "upstream");
    return this;
  }

  get next() {
    const n = this._underlying.next;
    return n === null
      ? null
      : { change: n.change, version: new Undo(this._info, n.version) };
  }

  append(c) {
    return new Undo(this._info, this._underlying.append(c));
  }

  reverseAppend(c) {
    return new Undo(this._info, this._underlying.reverseAppend(c));
  }

  undo() {
    Undo._syncInfo(this._info, "local");
    Undo._undo(this._info);
    return this;
  }

  redo() {
    Undo._syncInfo(this._info, "local");
    Undo._redo(this._info);
    return this;
  }

  static _syncInfo(info, type) {
    for (let next = info.s.next; next != null; next = info.s.next) {
      const { change, version } = next;
      info.changes.push({ type, change });
      info.s = next.version;
    }
  }

  static _undo(info) {
    let skips = 0;
    const last = info.changes.length - 1;
    for (let kk = 0; kk <= last; kk++) {
      switch (info.changes[last - kk].type) {
        case "redo":
        case "local":
          if (skips === 0) {
            return this._revertAt(info, last - kk, "undo");
          }
          skips--;
        case "undo":
          skips++;
      }
    }
  }

  static _redo(info) {
    let skips = 0;
    const last = info.changes.length - 1;
    for (let kk = 0; kk <= last; kk++) {
      switch (info.changes[last - kk].type) {
        case "undo":
          if (skips === 0) {
            return this._revertAt(info, last - kk, "redo");
          }
          skips--;
        case "redo":
          skips++;
        case "local":
          return;
      }
    }
  }

  static _revertAt(info, idx, type) {
    let { change } = info.changes[idx];
    if (change != null) {
      change = change.revert();
    }
    const rest = this._simplify(info.changes.slice(idx + 1));
    const [cx] = rest.merge(change);
    info.changes.push({ type, change: cx });
    info.s = info.s.append(cx);
  }

  // simplify remove undo/redo pairs from the sequence so as to not
  // confuse the merge which is not great with some of these cases
  static _simplify(changes) {
    let result = [];
    for (let kk = 0; kk < changes.length; kk++) {
      const l = result.length;
      if (l > 0 && this._cancels(result[l - 1].type, changes[kk].type)) {
        result.pop();
      } else {
        result.push(changes[kk]);
      }
    }

    return new Changes(result.map(x => x.change));
  }

  static _cancels(prevType, nextType) {
    switch (prevType) {
      case "local":
      case "redo":
        return nextType == "undo";
      case "undo":
        return nextType == "redo";
    }
    return false;
  }
}
