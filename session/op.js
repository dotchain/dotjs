// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { encode, decodeChange } from "../core";

export class Operation {
  constructor(id, parentId, version, basis, changes) {
    this.id = id;
    this.parentId = parentId;
    this.version = version;
    this.basis = basis;
    this.changes = changes;
  }

  toJSON() {
    const [id, parentId] = [encode(this.id), encode(this.parentId)];
    return [id, parentId, this.version, this.basis, encode(this.changes)];
  }

  static typeName() {
    return "ops.Operation";
  }

  static fromJSON(decoder, json) {
    const [id, parentId, version, basis, changes] = json;
    return new Operation(
      decoder.decode(id),
      decoder.decode(parentId),
      version,
      basis,
      decodeChange(decoder, changes)
    );
  }
}
