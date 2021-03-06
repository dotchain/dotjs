// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "../core/index.js";
import { Stream } from "./stream.js";

/* ValueStream is the generic value stream. */
export class ValueStream {
  constructor(value, stream) {
    this.value = value;
    this.stream = stream || new Stream();
  }

  replace(v) {
    const before = this.constructor.toValue(this.value);
    const after = this.constructor.toValue(v);
    return this.append(new Replace(before, after));
  }

  append(c) {
    const val = this.constructor.toValue(this.value);
    const applied = val.apply(c);
    return this.constructor.create(applied, this.stream.append(c));
  }

  get next() {
    if (this.stream.next === null) {
      return null;
    }

    const { change, version } = this.stream.next;
    const val = this.constructor.toValue(this.value);
    const applied = val.apply(change);
    return { change, version: this.constructor.create(applied, version) };
  }

  [Symbol.iterator]() {
    let next = { version: this };
    return {
      next() {
        if (next !== null) {
          next = next.version.next;
        }
        return next === null ? { done: true } : { value: next.version };
      }
    };
  }

  latest() {
    let result = this;
    for (let next of this) {
      result = next;
    }
    return result;
  }

  static toValue(val) {
    return val;
  }

  static create(val, stream) {
    return new ValueStream(val, stream);
  }
}
