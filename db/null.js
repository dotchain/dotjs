// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Value } from "./value.js";
import { Decoder } from "./decode.js";

/** Null represents an empty value */
export class Null extends Value {
  /** clone makes a copy but with stream set to null */
  clone() {
    return new Null();
  }

  toJSON() {
    return [];
  }

  static typeName() {
    return "changes.empty";
  }

  static fromJSON() {
    return new Null();
  }
}

Decoder.registerValueClass(Null);
