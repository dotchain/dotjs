// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { registerValueClass } from "./value.js";
import { Replace } from "./replace.js";
import { encode } from "./encode.js";

// Atomic represents an atomic value type
export class Atomic {
  constructor(value) {
    if (value === undefined) {
      this.value = null;
    } else {
      this.value = value;
    }
  }

  apply(c) {
    if (!c) {
      return this;
    }

    if (c instanceof Replace && c.before instanceof Atomic) {
      return c.after;
    }
    return c.applyTo(this);
  }

  toJSON() {
    return [encode(this.value)];
  }

  static typeName() {
    return "changes.Atomic";
  }

  static fromJSON(decoder, json) {
    return new Atomic(decoder.decode(json[0]));
  }
}

registerValueClass(Atomic);
