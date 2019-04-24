// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Stream } from "./stream.js";

export class ValueStream {
  constructor(value, stream) {
    this.value = value;
    this.stream = stream || new Stream();
  }

  append(c) {
    const val = this.constructor.toValue(this.value);
    const applied = val.apply(c);
    return this.constructor.create(applied, this.stream.append(c));
  }

  get next() {
    const next = this.stream.nextInstance;
    if (next == null) {
      return null;
    }

    const val = this.constructor.toValue(this.value);
    const applied = val.apply(this.stream.nextChange);
    return this.constructor.create(applied, this.stream.nextInstance);
  }

  [Symbol.iterator]() {
    let value = this;
    return {
      next() {
        if (value !== null) {
          value = value.next;
        }
        return value === null ? { done: true } : { value };
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
