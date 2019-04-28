// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { PathChange, Changes, Replace, Splice } from "../core/index.js";

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
  const { xform, path, ok } = transform(next.change, s.path);
  if (!ok) {
    return null;
  }

  return { change: xform, version: new Substream(next.version, path) };
}

function transform(c, path) {
  if (c === null) {
    return { xform: c, path, ok: true };
  }

  if (c instanceof Replace) {
    return { xform: null, path, ok: false };
  }

  if (c instanceof Splice) {
    path = c.mapPath(path);
    return { xform: null, path, ok: path !== null };
  }

  if (c instanceof PathChange) {
    const len = PathChange.commonPrefixLen(path, c.path);

    if (len === ((c.path && c.path.length) || 0)) {
      const { xform, path: p2, ok } = transform(c.change, path.slice(len));
      if (ok) {
        path = path.slice(0, len).concat(p2);
      }
      return { xform, path, ok };
    }

    if (len === path.length) {
      const xform = PathChange.create(c.path.slice(len), c.change);
      return { xform, path, ok: true };
    }
  }

  if (c instanceof Changes) {
    const result = [];
    for (let cx of c) {
      const { xform, path: p2, ok } = transform(cx, path);
      if (!ok) {
        return { xform, path, ok };
      }
      path = p2;
      result.push(updated);
    }
    const xform = Changes.create(result);
    return { xform, path, ok: true };
  }
}
