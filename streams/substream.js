// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { PathChange, Changes, Replace } from "../core";

export class Substream {
  constructor(parent, path) {
    this.parent = parent;
    this.path = path;
  }

  append(c) {
    return this.parent.append(new PathChange(this.path, c));
  }

  reverseAppend(c) {
    return this.parent.reverseAppend(new PathChange(this.path, c));
  }

  get nextChange() {
    return next(this.parent, this.path)[0];
  }

  get nextInstance() {
    const [c, parent] = next(this.parent, this.path);
    if (parent !== null) {
      return new Substreaam(parent, this.path);
    }
  }
}

function next(parent, path) {
  const nextInstance = parent.nextInstance;
  if (nextInstance === null) {
    return [null, null];
  }
  const [c, ok] = transform(parent.nextChange, path);
  if (!ok) {
    return [null, null];
  }
  return [c, parent.nextInstance];
}

function transform(c, path) {
  if (c === null) {
    return [null, true];
  }

  if (c instanceof Replace) {
    return [null, false];
  }

  if (c instanceof PathChange) {
    const len = PathChange.commonPrefixLen(path, c.path);
    if (len === ((c.path && c.path.length) || 0)) {
      return transform(c.change, path.slice(len));
    }
    if (len === path.length) {
      return [PathChange.create(c.path.slice(len), c.change), true];
    }
  }

  if (c instanceof Changes) {
    const result = [];
    for (let cx of c) {
      const [updated, ok] = transform(cx, path);
      if (!ok) {
        return [null, false];
      }
      result.push(updated);
    }
    return Changes.create(result);
  }
}
