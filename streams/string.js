// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Stream } from "./stream.js";
import { ValueStream } from "./value.js";
import { Replace, Atomic } from "../core";

export class StringStream extends ValueStream {
  constructor(value, stream) {
    if (value instanceof Atomic) {
      value = value.value;
    }
    if (typeof value != "string") {
      throw "value must be string";
    }
    super(value, stream);
  }

  replace(value) {
    if (typeof value != "string") {
      throw "replacement must be a string";
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
    throw new "unexpected value type: "() + val.constructor.name;
  }
}