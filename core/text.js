// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { Splice } from "./splice.js";
import { Move } from "./move.js";

/**
 * Text represents a string value that supports Splice/Move etc.
 */
export class Text {
  constructor(text) {
    this.text = text || "";
  }

  slice(start, end) {
    return new Text(this.text.slice(start, end));
  }

  get length() {
    return this.text.length;
  }

  /**
   * Apply any change immutably.
   * @param {Change} c -- any change; can be null.
   * @returns {Value}
   */
  apply(c) {
    if (!c) {
      return this;
    }

    if (c instanceof Replace) {
      return c.after;
    }

    if (c instanceof Splice) {
      const left = this.text.slice(0, c.offset);
      const right = this.text.slice(c.offset + c.before.length);
      return new Text(left + c.after.text + right);
    }

    if (c instanceof Move) {
      let { offset: o, distance: d, count: cx } = c;
      if (d < 0) {
        [o, cx, d] = [o + d, -d, cx];
      }

      const s1 = this.text.slice(0, o);
      const s2 = this.text.slice(o, o + cx);
      const s3 = this.text.slice(o + cx, o + cx + d);
      const s4 = this.text.slice(o + cx + d);
      return new Text(s1 + s3 + s2 + s4);
    }

    return c.applyTo(this);
  }

  toJSON() {
    return this.text;
  }

  static typeName() {
    return "changes/types.S16";
  }

  static fromJSON(decoder, json) {
    return new Text(json);
  }
}
