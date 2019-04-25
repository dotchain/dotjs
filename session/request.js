// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { encode } from "../core";
import { Operation } from "./op.js";

export class Request {
  constructor(name, ops, version, limit, duration) {
    this.name = name;
    this.ops = ops;
    this.version = version;
    this.limit = limit;
    this.duration = duration;
  }

  toJSON() {
    const ops = (this.ops || []).map(encode);
    return [this.name, ops, this.version, this.limit, this.duration];
  }

  static typeName() {
    return "ops/nw.request";
  }

  static fromJSON(decoder, json) {
    const [name, ops, version, limit, duration] = json;
    const opx = (ops || []).map(
      op => Operation.fromJSON[op[Operation.typeName()]]
    );
    if (name == "Append") {
      return new AppendRequest(ops);
    } else {
      return new GetSinceRequest(version, limit, duration);
    }
  }
}

export class AppendRequest extends Request {
  constructor(ops) {
    super("Append", ops, -1, -1, 0);
  }
}

export class GetSinceRequest extends Request {
  constructor(version, limit, duration) {
    super("GetSince", null, version, limit, duration);
  }
}
