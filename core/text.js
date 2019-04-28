// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { Splice } from "./splice.js";

// Text represents a JS-friend text (using UTF16 encoding)
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

    return c.applyTo(this);
  }

  toJSON() {
    return this.text;
  }

  static typeName() {
    return "types.S16";
  }

  static fromJSON(decoder, json) {
    return new Text(json);
  }
}
