// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Dict } from "./dict.js";
import { Decoder } from "./decode.js";
import { Stream } from "./stream.js";
import { Operation } from "./op.js";
import { Conn } from "./conn.js";
import { Transformer } from "./transform.js";

/** Store implements a collection of tables with ability to sync via a
 * connection */
export class Store {
  /**
   * @param {Conn|Transformer|string} conn - can be url or Conn
   * @param {Object} serialized? - output of prev serialze() call
   */
  constructor(conn, serialized) {
    const data = serialized || { root: [], session: { version: -1 } };
    if (typeof fetch == "function" && typeof conn == "string") {
      conn = new Transformer(new Conn(conn, fetch)); //eslint-disable-line
    }
    this._conn = conn;
    this._root = Dict.fromJSON(new Decoder(), data.root).setStream(
      new Stream()
    );

    // All root collections are "implict" and get created on access
    this._root.setDefaultFn(() => new Dict());
    this._session = {
      stream: this._root.stream,
      version: data.session.version,
      pending: (data.session.pending || []).slice(0),
      merge: (data.session.merge || []).slice(0),
      reading: null,
      writing: null,

      // not yet pushed to server
      unsent: (data.session.pending || []).slice(0),
      // have received from server but not applied to model yet
      unmerged: []
    };
  }

  /** collection returns a collection by name */
  collection(name) {
    return this._root.get(name);
  }

  /** @type {Object} null or {change, version} */
  get next() {
    const n = this._root.next;
    if (!n) {
      return null;
    }

    const store = new Store(this._conn, null);
    store._root = n.version;
    store._session = this._session;
    return { change: n.change, version: store };
  }

  sync() {
    return this.pull().then(() => this.push());
  }

  pull() {
    const s = this._session;

    // apply server operations
    for (let op of s.unmerged) {
      if (s.pending.length && s.pending[0].id == op.id) {
        // ack
        s.pending.shift();
        s.merge.shift();
      } else {
        for (let kk = 0; kk < s.meerge.length; kk++) {
          [s.merge[kk], op] = op.merge(s.merge[kk]);
        }
        s.stream = s.stream.reverseAppend(op.changes);
      }
      s.version = op.version;
    }

    // read more operations
    if (!s.reading) {
      s.reading = this._conn.read(s.version + 1, 1000).then(ops => {
        s.unmerged = s.unmerged.concat(ops || []);
        s.reading = null;
      });
    }
    return s.reading;
  }

  push() {
    const s = this._session;

    // collect all pending activity on the root stream
    const len = (s.pending || []).length;
    let pid = len > 0 ? s.pending[len - 1].id : null;
    for (let next = s.stream.next; next != null; next = next.version.next) {
      const op = new Operation(null, pid, -1, this._version, next.change);
      s.unsent.push(op);
      s.pending.push(op);
      s.stream = next.version;
    }

    // write to connection
    if (!s.writing) {
      const ops = s.unsent.slice(0);
      if (len(ops) == 0) {
        return Promise.resolve(null);
      }

      s.writing = this._conn.write(ops).then(() => {
        for (let kk = 0; kk < ops.length; kk++) {
          s.unsent.shift();
        }
        s.writing = null;
      });
    }
    return s.writing;
  }

  serialize() {
    const { version, pending, merge } = this._session;
    const session = { version, pending, merge };
    return { root: this._root.toJSON(), session };
  }
}
