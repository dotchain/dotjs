// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

let getRandomValues = null;

if (typeof crypto !== "undefined") {
  getRandomValues = b => crypto.getRandomValues(b);
}

/** Operation is the change and metadata needed for network transmission */
export class Operation {
  /**
   * @param {string} [id] - the id is typically auto-generated.
   * @param {string} [parentId] - the id of the previous unacknowledged local op.
   * @param {int} [version] - the zero-based index is updated by the server.
   * @param {int} basis -- the version of the last applied acknowledged op.
   * @param {Change} changes -- the actual change being sent to the server.
   */
  constructor(id, parentId, version, basis, changes) {
    this.id = id || Operation.newId();
    this.parentId = parentId;
    this.version = version;
    this.basis = basis;
    this.changes = changes;
  }

  toJSON() {
    const unencoded = [this.id, this.parentId, this.changes];
    const [id, parentId, c] = Encoder.encodeArrayValue(unencoded);
    return [id, parentId, this.version, this.basis, c];
  }

  merge(otherOp) {
    if (!this.changes) {
      return [otherOp, this];
    }

    const [l, r] = this.changes.merge(otherOp.changes)
    return [otherOp.withChanges(l), this.withChanges(r)];
  }

  withChanges(c) {
    return new Operation(this.id, this.parentId, this.version, this.basis, c);
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
      decoder.decodeChange(changes)
    );
  }

  static newId() {
    const bytes = new Uint8Array(16);
    getRandomValues(bytes);
    const toHex = x => ("00" + x.toString(16)).slice(-2);
    return Array.prototype.map.call(bytes, toHex).join("");
  }

  /*
   * useCrypto should be used to provide the polyfill for crypto
   * @param [Object] crypto - the crypto module
   * @param [function] cyrpto.randomFillSync -- this is only function used here
   */
  static useCrypto(crypto) {
    getRandomValues = crypto.randomFillSync;
  }
}
