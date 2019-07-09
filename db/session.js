// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";
import { Operation } from "./op.js";
import { Null } from "./null.js";
import { Conn } from "./conn.js";
import { Transformer } from "./transform.js";
import { Stream } from "./stream.js";
import { undoable } from "./undo.js";

/** Session implements helpers for creating a session */
export class Session {
  /** undoable wraps the object with a undo stack **/
  static undoable(obj) {
    return obj.clone().setStream(undoable(obj.stream));
  }

  /** Serialize serializes a connected value for later
   * use with connect */
  static serialize(obj) {
    const root = Encoder.encode(obj.latest());
    const stream = obj.stream;
    if (!stream || !(stream instanceof SessionStream)) {
      return { root, version: -1, merge: [], pending: [] };
    }

    stream._push();
    stream._pull();
    const result = {
      root: root,
      version: stream._info.version,
      merge: stream._info.merge,
      pending: stream._info.pending
    };
    return JSON.parse(JSON.stringify(result));
  }

  /** connect creates a root object that can sync against
   * the provided URL. If serialized is not provided, a Null
   * initial object is created. */
  static connect(url, serialized) {
    const conn = this._conn(url);
    const { root, version, merge, pending } = this._root(serialized);
    const parent = new Stream();
    const info = {
      conn: conn,
      stream: parent,
      version: version,
      pending: (pending || []).slice(0),
      merge: (merge || []).slice(0),
      pulling: null,
      pushing: null,
      unsent: (pending || []).slice(0),
      unmerged: []
    };
    return root.setStream(new SessionStream(parent, info));
  }

  static _root(serialized) {
    if (!serialized) {
      return { root: new Null(), version: -1 };
    }

    const d = new Decoder();
    const root = d.decodeValue(serialized.root);
    const { version } = serialized;
    const merge = serialized.merge.map(x => Operation.fromJSON(d, x));
    const pending = serialized.pending.map(x => Operation.fromJSON(d, x));

    return { root, version, merge, pending };
  }

  static _conn(url) {
    if (typeof url !== "string") {
      return url;
    }
    // eslint-disable-next-line
    const f = typeof fetch == "function" ? fetch : null;
    return new Transformer(new Conn(url, f));
  }
}

// SessionStream implements a stream where push/pull
// effectively push/push against a connection.
class SessionStream {
  constructor(parent, info) {
    this._parent = parent;
    this._info = info;
  }

  append(c) {
    return { change: c, version: this._setParent(this._parent.append(c)) };
  }

  reverseAppend(c) {
    return {
      change: c,
      version: this._setParent(this._parent.reeverseAppend(c))
    };
  }

  undo() {
    this._parent.undo();
    return this;
  }

  redo() {
    this._parent.redo();
    return this;
  }

  get next() {
    const n = this._parent.next;
    if (!n) {
      return null;
    }

    return { change: n.change, version: this._setParent(n.version) };
  }

  _setParent(parent) {
    return new SessionStream(parent, this._info);
  }

  push() {
    this._push();
    const info = this._info;
    if (!info.pushing) {
      const ops = info.unsent.slice(0);
      if (ops.length === 0) {
        return Promise.resolve(null);
      }
      info.pushing = info.conn
        .write(ops)
        .then(() => {
          info.unsent = info.unsent.slice(ops.length);
        })
        .finally(() => {
          info.pushing = null;
        });
    }
    return info.pushing;
  }

  _push() {
    const s = this._info;
    const len = (s.pending || []).length;
    let pid = len > 0 ? s.pending[len - 1].id : null;
    for (let next = s.stream.next; next; next = next.version.next) {
      const op = new Operation(null, pid, -1, s.version, next.change);
      s.unsent.push(op);
      s.pending.push(op);
      s.stream = next.version;
      pid = op.id;
    }
  }

  pull() {
    this._pull();
    const info = this._info;
    if (!info.pulling) {
      const ver = info.version + 1;
      info.pulling = info.conn
        .read(ver, 1000)
        .then(ops => {
          info.unmerged = info.unmerged.concat(ops || []);
        })
        .finally(() => {
          info.pulling = null;
        });
    }
    return info.pulling;
  }

  _pull() {
    const s = this._info;

    // apply server operations
    for (let op of s.unmerged) {
      if (s.pending.length && s.pending[0].id == op.id) {
        // ack
        s.pending = s.pending.slice(1);
        s.merge = s.merge.slice(1);
      } else {
        for (let kk = 0; kk < s.merge.length; kk++) {
          [s.merge[kk], op] = op.merge(s.merge[kk]);
        }
        s.stream = s.stream.reverseAppend(op.changes);
      }
      s.version = op.version;
    }
  }
}
