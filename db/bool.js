// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "./decode.js";
import { Value } from "./value.js";

/** Bool represents true/false */
export class Bool extends Value {
  constructor(b) {
    super();
    this.b = Boolean(b);
  }

  valueOf() {
    return this.b;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Bool(this.b);
  }

  toJSON() {
    return this.b;
  }

  static typeName() {
    return "dotdb.Bool";
  }

  static fromJSON(decoder, json) {
    return new Bool(json);
  }
}

Decoder.registerValueClass(Bool);
