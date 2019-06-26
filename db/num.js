// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

import { Replace } from "./replace.js";
import { Value } from "./value.js";

/** Num represents a generic numeric type */
export class Num extends Value {
  constructor(num) {
    super();
    this.n = parseFloat(+num);
    if (isNaN(this.n) || !isFinite(this.n)) {
      throw new Error("not a number: " + num);
    }
  }

  valueOf() {
    return this.n;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Num(this.n);
  }

  toJSON() {
    return this.n;
  }

  static typeName() {
    return "dotdb.Num";
  }

  static fromJSON(decoder, json) {
    return new Num(json);
  }
}

Decoder.registerValueClass(Num);
