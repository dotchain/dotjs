// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { PathChange} from "./path_change.js";
import { Changes } from "./changes.js";
import { Move } from "./move.js";
import { Splice } from "./splice.js";
import { Replace } from "./replace.js";

const sentinel = {};

/* Substream refers to a field embedded within a container stream */
export class Substream {
  constructor(parent, key) {
    this.parent = parent;
    this.key = key;
    this._next = sentinel;
  }

  append(c) {
    return this.parent.append(new PathChange([this.key], c));
  }

  reverseAppend(c) {
    return this.parent.reverseAppend(new PathChange([this.key], c));
  }

  get next() {
    if (this._next !== sentinel) {
      return this._next;
    }

    if (this.parent.next == null) {
      return null;
    }

    this._next = getNext(this);
    return this._next;
  }

  push() {
    this.parent.push();
    return this;
  }

  pull() {
    this.parent.pull();
    return this;
  }

  undo() {
    this.parent.undo();
    return this;
  }

  redo() {
    this.parent.redo();
    return this;
  }
}

function getNext(s) {
  const next = s.parent.next;
  const { xform, key, ok } = transform(next.change, s.key);
  if (!ok) {
    return null;
  }

  return { change: xform, version: new Substream(next.version, key) };
}

function transform(c, key) {
  if (c === null) {
    return { xform: c, key, ok: true };
  }

  if (c instanceof Replace) {
    return { xform: null, key, ok: false };
  }

  if (c instanceof Splice || c instanceof Move) {
    const path = c.mapPath([key]);
    if (path == null) {
      return { xform: null, key, ok: false };
    }
    return { xform: null, key: path[0], ok: true };
  }

  if (c instanceof PathChange) {
    if ((c.path || []).length == 0) {
      return transform(c.change, key);
    }

    const len = PathChange.commonPrefixLen([key], c.path);
    if (len == 0) {
      return {xform: null, key, ok: true};
    }

    const xform = PathChange.create(c.path.slice(1), c.change);
    return { xform, key, ok: true };
  }

  if (c instanceof Changes) {
    const result = [];
    for (let cx of c) {
      const { xform, key: k2, ok } = transform(cx, key);
      if (!ok) {
        return { xform, key, ok };
      }
      key = k2;
      if (xform) {
        result.push(xform);
      }
    }
    const xform = Changes.create(result);
    return { xform, key, ok: true };
  }

  throw new Error("unknown change type: " + c.constructor.name);
}
