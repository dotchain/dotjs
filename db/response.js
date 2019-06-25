// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Operation } from "./op.js";

export class Response {
  constructor(ops, err) {
    this.ops = ops || [];
    this.err = err || null;
  }

  toJSON() {
    let err = null;
    if (this.err) {
      const s = this.err.toString().replace("Error: ", "");
      err = { "ops/nw.strError": s };
    }

    return [Encoder.encodeArrayValue(this.ops || []), err];
  }

  static typeName() {
    return "ops/nw.response";
  }

  static fromJSON(decoder, json) {
    const err = (json[1] && new Error(json[1]["ops/nw.strError"])) || null;
    const decode = op => Operation.fromJSON(decoder, op[Operation.typeName()]);
    return new Response((json[0] || []).map(decode), err);
  }
}
