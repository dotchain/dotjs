// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

/**
 * undoable creates an undo stream.
 *
 * All changes to the parent stream are tracked and calls to
 * undo() and redo() on the returned stream correspondingly
 * behaving like global undo/redo: i.e. they revert or reapply
 * the corresponding changes and behave like an undo stack in
 * an editor.
 *
 * This is resilient to interleaving upstream changes, appropriately
 * transforming the local change to preserve the intent of the
 * change.
 *
 * @param {Stream} s - parent stream
 * @returns {Stream}
 */
export function undoable(s) {
  return new UndoStream(s, new UndoStack(s));
}

class UndoStream {
  constructor(parent, stack) {
    this.parent = parent;
    this.stack = stack;
  }

  get next() {
    const n = this.parent.next;
    if (!n) {
      return null;
    }

    return { change: n.change, version: new UndoStream(n.version, this.stack) };
  }

  append(c) {
    this.stack.flush();
    const parent = this.parent.append(c);
    this.stack.pickupLocalChanges();
    return new UndoStream(parent, this.stack);
  }

  reverseAppend(c) {
    this.stack.flush();
    const parent = this.parent.reverseAppend(c);
    this.stack.pickupLocalChanges();
    return new UndoStream(parent, this.stack);
  }

  push() {
    return this.parent.push();
  }

  pull() {
    return this.parent.pull();
  }

  undo() {
    return this.stack.undo();
  }

  redo() {
    return this.stack.redo();
  }
}

class UndoStack {
  constructor(s) {
    this.undos = [];
    this.redos = [];
    this.stream = s;
  }

  flush() {
    for (let next = this.stream && this.stream.next; next; ) {
      this.stream = next.version;
      this.undos = UndoStack.merge(this.undos, next.change);
      this.redos = UndoStack.merge(this.redos, next.change);
      next = this.stream.next;
    }
  }

  pickupLocalChanges() {
    for (let next = this.stream && this.stream.next; next; ) {
      this.stream = next.version;
      const c = next.change;
      if (c) {
        this.undos.push(c.revert());
      }
      this.redos.length = 0;
      next = this.stream.next;
    }
  }

  undo() {
    this.flush();
    if (!this.undos.length) {
      return null;
    }
    const c = this.undos.shift();
    this.redos.unshift(c.revert());
    this.stream = this.stream.append(c);
    return c;
  }

  redo() {
    this.flush();
    if (!this.redos.length) {
      return null;
    }
    const c = this.redos.shift();
    this.undos.unshift(c.revert());
    this.stream = this.stream.append(c);
    return c;
  }

  static merge(changes, cx) {
    const result = [];
    let updated = null;
    for (let kk = 0; kk < changes.length; kk++) {
      if (!cx) {
        result.push(changes[kk]);
      } else {
        [updated, cx] = cx.merge(changes[kk]);
        if (updated) {
          result.push(updated);
        }
      }
    }
    return result;
  }
}
