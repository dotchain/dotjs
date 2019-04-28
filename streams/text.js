// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Stream } from "./stream.js";
import { ValueStream } from "./value.js";
import { Replace, Splice, Text } from "../core/index.js";

export class TextStream extends ValueStream {
  constructor(value, stream) {
    if (typeof value != "string") {
      throw "value must be string";
    }
    super(value, stream);
  }

  replace(value) {
    if (typeof value != "string") {
      throw "replacement must be a string";
    }
    return super.append(new Replace(new Text(this.value), new Text(value)));
  }

  splice(offset, removeCount, replacement) {
    const r = replacement || "";
    if (typeof r != "string") {
      throw "replacement must be a string";
    }

    const before = this.value.slice(offset, offset + removeCount);
    return super.append(new Splice(offset, before, new Text(r)));
  }

  static toValue(val) {
    return new Text(val);
  }

  static create(val, stream) {
    if (typeof val === "string") {
      return new TextStream(val, stream);
    }
    if (val instanceof Text) {
      return this.create(val.text, stream);
    }
    throw new "unexpected value type: "() + val.constructor.name;
  }
}
