// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Substream } from "./substream.js";
import { ValueStream } from "./value.js";
import { Splice, List, Replace, Move } from "../core/index.js";

/* ListStream implements a generic list stream.
 *
 * This is present for completeness with the preferred
 * approach being custom lists.
 */
export class ListStream extends ValueStream {
  constructor(value, stream) {
    let l = value;
    if (l === null || l === undefined || Array.isArray(l)) {
      l = new List(value);
    }

    if (!(l instanceof List)) {
      throw new Error(
        "ListStream requires array of key/value pairs or dotjs.List"
      );
    }

    super(l, stream);
  }

  get(idx) {
    return this.value.entries[idx];
  }

  set(idx, value) {
    const before = new List([this.value.entries[idx]]);
    const splice = new Splice(idx, before, new List([value]));
    return super.append(splice);
  }

  replace(value) {
    const after = new ListStream(value);
    return super.append(new Replace(this.value, after.value));
  }

  splice(offset, removeCount, replacement) {
    const before = new List([
      this.value.entries.slice(offset, offset + removeCount)
    ]);
    if (!replacement) {
      replacement = new List();
    }

    if (!(replacement instanceof List)) {
      throw new Error("replacement must be a dotjs.List");
    }

    return super.append(new Splice(offset, before, replacement));
  }

  move(offset, count, distance) {
    return super.append(new Move(offset, count, distance));
  }

  push(item) {
    return this.splice(this.value.entries.length, 0, new List([item]));
  }

  pop() {
    const len = this.value.entries.length;
    if (len === 0) {
      return null;
    }

    return {
      value: this.get(len - 1),
      stream: this.splice(len - 1, 1)
    };
  }

  substream(key, ctor) {
    return new ctor(this.value.entries[key], new Substream(this.stream, [key]));
  }

  static create(val, stream) {
    return new ListStream(val, stream);
  }
}
