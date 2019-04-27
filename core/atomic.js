// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

import { Replace } from "./replace.js";

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
    return [Encoder.encode(this.value)];
  }

  static typeName() {
    return "changes.Atomic";
  }

  static fromJSON(decoder, json) {
    return new Atomic(decoder.decode(json[0]));
  }
}

Decoder.registerValueClass(Atomic);
