// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder, Decoder } from "../core/index.js";
import { Operation } from "./op.js";
import { AppendRequest, GetSinceRequest } from "./request.js";
import { Response } from "./response.js";

/** Transformer wraps a {@link Conn} object, transforming all incoming ops */
export class Transformer {
  /**
   * @param {Conn} conn -- the connection to wrap.
   * @param {Object} [cache] -- an optional ops cache.
   * @param {Object} cache.untransformed -- a map of version => raw operation.
   * @param {Object} cache.transformed - a map of version => transformed op.
   * @param {Object} cache.merge - a map of version to array of merge ops.
   */
  constructor(conn, cache) {
    this._c = conn;
    this._cache = cache || { untransformed: {}, transformed: {}, merge: {} };
  }

  /** write passes through to the underlying {@link Conn} */
  write(ops) {
    return this._c.write(ops);
  }

  /** read is the work horse, fetching ops from {@link Conn} and transforming it as needed */
  async read(version, limit) {
    const transformed = this._cache.transformed[version];
    let ops = [];
    if (transformed) {
      for (let count = 0; count < limit; count++) {
        const op = this._cache.transformed[version + count];
        if (!op) break;
        ops.push(op);
      }
      return ops;
    }

    const raw = this._cache.untransformed[version];
    if (!raw) {
      ops = await this._c.read(version, limit);
    } else {
      for (let count = 0; count < limit; count++) {
        const op = this._cache.untransformed[version + count];
        if (!op) break;
        ops.push(op);
      }
    }

    const result = [];
    for (let op of ops || []) {
      this._cache.untransformed[op.version] = op;
      const { xform } = await this._transformAndCache(op);
      result.push(xform);
    }
    return result;
  }

  async _transformAndCache(op) {
    if (!this._cache.transformed[op.version]) {
      const { xform, merge } = await this._transform(op);
      this._cache.transformed[op.version] = xform;
      this._cache.merge[op.version] = merge;
    }

    const xform = this._cache.transformed[op.version];
    const merge = this._cache.merge[op.version].slice(0);
    return { xform, merge };
  }

  async _transform(op) {
    const gap = op.version - op.basis - 1;
    if (gap === 0) {
      // no interleaved op, so no special transformation needed.
      return { xform: op, merge: [] };
    }

    // fetch all ops since basis
    const ops = await this.read(op.basis + 1, gap);

    let xform = op;
    let merge = [];

    if (op.parentId) {
      // skip all those before the parent if current op has parent
      while (!Transformer._equal(ops[0].id, op.parentId)) {
        ops.shift();
      }
      const parent = ops[0];
      ops.shift();

      // The current op is meant to be applied on top of the parent op.
      // The parent op has a merge chain which corresponds to the set of
      // operation were accepted by the server before the parent operation
      // but which were not known to the parent op.
      //
      // The current op may have factored in a few but those in the
      // merge chain that were not factored would contribute to its own
      // merge chain.
      ({ xform, merge } = await this._getMergeChain(op, parent));
    }

    // The transformed op needs to be merged against all ops that were
    // accepted by the server between the parent and the current op.
    for (let opx of ops) {
      let { xform: x } = await this._transformAndCache(opx);
      [xform, x] = Transformer._merge(x, xform);
      merge.push(x);
    }

    return { xform, merge };
  }

  // getMergeChain gets all operations in the merge chain of the parent
  // that hove not been factored into the current op.  The provided op
  // is transformed against this merge chain to form its own initial merge
  // chain.
  async _getMergeChain(op, parent) {
    const { merge } = await this._transformAndCache(parent);
    while (merge.length > 0 && merge[0].version <= op.basis) {
      merge.shift();
    }

    let xform = op;
    for (let kk = 0; kk < merge.length; kk++) {
      [xform, merge[kk]] = Transformer._merge(merge[kk], xform);
    }

    return { xform, merge };
  }

  static _merge(op1, op2) {
    let [c1, c2] = [op2.changes, op1.changes];
    if (op1.changes) {
      [c1, c2] = op1.changes.merge(op2.changes);
    }

    const op1x = new Operation(
      op2.id,
      op2.parentId,
      op2.version,
      op2.basis,
      c1
    );
    const op2x = new Operation(
      op1.id,
      op1.parentId,
      op1.version,
      op1.basis,
      c2
    );
    return [op1x, op2x];
  }

  static _equal(id1, id2) {
    // IDs can be any type, so to be safe JSON stringify it.
    return JSON.stringify(id1) == JSON.stringify(id2);
  }
}
