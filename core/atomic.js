// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

import { Replace } from "./replace.js";

/**
 * Implements DOTJS value semantics for atomic values.
 *
 * An atomic value can only be replaced as a whole.
 */
export class Atomic {
  /**
   * @param {Any} value - the value being wrapped.
   */
  constructor(value) {
    if (value === undefined) {
      this.value = null;
    } else {
      this.value = value;
    }
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
