// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Stream } from "./stream.js";
import { ValueStream } from "./value.js";
import { Replace, Atomic } from "../core/index.js";

/* StringStream defines an atomic string value stream.
 *
 * For the most part, applications should use TextStream instead.
 */
export class StringStream extends ValueStream {
  /**
   * @param {string} value - initial string value
   * @param {Stream] [stream] - the change stream
   */
  constructor(value, stream) {
    if (value instanceof Atomic) {
      value = value.value;
    }
    if (typeof value != "string") {
      throw new Error("value must be string");
    }
    super(value, stream);
  }

  replace(value) {
    if (typeof value != "string") {
      throw new Error("replacement must be a string");
    }
    return super.append(new Replace(new Atomic(this.value), new Atomic(value)));
  }

  static toValue(val) {
    return new Atomic(val);
  }

  static create(val, stream) {
    if (typeof val === "string") {
      return new StringStream(val, stream);
    }
    if (val instanceof Atomic) {
      return this.create(val.value, stream);
    }
    throw new Error("unexpected value type: " + val.constructor.name);
  }
}
