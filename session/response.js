// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { encode } from "../core/index.js";
import { Operation } from "./op.js";

export class Response {
  constructor(ops, err) {
    this.ops = ops || [];
    this.err = err || null;
  }

  toJSON() {
    const err = this.err ? { "ops/nw.strError": err.toString() } : null;
    return [ops.map(encode), err];
  }

  static typeName() {
    return "ops/nw.response";
  }

  static fromJSON(decoder, json) {
    const err = json[1] && new Error(json[1]["ops/nw.strError"]);
    const decode = op => Operation.fromJSON(decoder, op[Operation.typeName()]);
    return new Response((json[0] || []).map(decode), err);
  }
}
