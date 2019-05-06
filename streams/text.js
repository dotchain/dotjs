// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Stream } from "./stream.js";
import { ValueStream } from "./value.js";
import { Replace, Splice, Text } from "../core/index.js";

/* TextStream represents a mutable text value stream */
export class TextStream extends ValueStream {
  /**
   * @param {string} value - initial text
   * @param {Stream} [stream] - optional change stream
   */
  constructor(value, stream) {
    if (value instanceof Text) {
      value = value.text;
    }

    if (typeof value != "string") {
      throw new Error("value must be string");
    }
    super(value, stream);
  }

  /*
   * replace with another string
   * @param {string} value - replacement
   * @returns {TextStream}
   */
  replace(value) {
    if (typeof value != "string") {
      throw new Error("replacement must be a string");
    }
    return super.append(new Replace(new Text(this.value), new Text(value)));
  }

  /*
   * splice substring with another
   * @param {int} offset - start of substring
   * @param {int} removeCount - number of code points in substream to remove
   * @param {string} [replacement] - the replacement string to insert
   * @returns {TextStream}
   */
  splice(offset, removeCount, replacement) {
    const r = replacement || "";
    if (typeof r != "string") {
      throw new Error("replacement must be a string");
    }

    const before = this.value.slice(offset, offset + removeCount);
    return super.append(new Splice(offset, new Text(before), new Text(r)));
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
    throw new Error("unexpected value type: " + val.constructor.name);
  }
}
