// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { PathChange, Changes, Replace } from "../core/index.js";

const sentinel = {};
export class Substream {
  constructor(parent, path) {
    this.parent = parent;
    this.path = path;
    this._next = sentinel;
  }

  append(c) {
    return this.parent.append(new PathChange(this.path, c));
  }

  reverseAppend(c) {
    return this.parent.reverseAppend(new PathChange(this.path, c));
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
}

function getNext(s) {
  const next = s.parent.next;
  const { xform, ok } = transform(next.change, s.path);
  if (!ok) {
    return null;
  }

  return { change: xform, version: new Substream(next.version, s.path) };
}

function transform(c, path) {
  if (c === null) {
    return { xform: c, ok: true };
  }

  if (c instanceof Replace) {
    return { xform: null, ok: false };
  }

  if (c instanceof PathChange) {
    const len = PathChange.commonPrefixLen(path, c.path);

    if (len === ((c.path && c.path.length) || 0)) {
      return transform(c.change, path.slice(len));
    }

    if (len === path.length) {
      const xform = PathChange.create(c.path.slice(len), c.change);
      return { xform, ok: true };
    }
  }

  if (c instanceof Changes) {
    const result = [];
    for (let cx of c) {
      const { xform, ok } = transform(cx, path);
      if (!ok) {
        return { xform, ok };
      }
      result.push(updated);
    }
    const xform = Changes.create(result);
    return { xform, ok: true };
  }
}
