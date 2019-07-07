// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Stream } from "../streams/index.js";
import { Operation } from "./op.js";

/** Session syncs a local stream with an network connection */
export class Session {
  constructor() {
    this._version = -1;
    this._unsent = [];
    this._merge = [];
    this._unacked = [];
    this._acked = [];
    this._unmerged = [];
    this._stream = new Stream();
    this._reading = null;
    this._writing = null;
    this._pauseReadUntil = 0;
    this._pauseWriteUntil = 0;
    this._now = () => new Date().getTime();
    this._log = { error() {} };
  }

  /** configure logger for reporting errors.
   * @param {Object} log - only log.error(...) is used.
   * @returns {Session}
   */
  withLog(log) {
    this._log = log || { error() {} };
    return this;
  }

  /** configure time function
   * @param {Function} now - use () => (new Date).getTime()
   * @returns {Session}
   */
  withNow(now) {
    this._now = now;
    return this;
  }

  /** configure state for restarting a session
   * @param {Operation[]} pending - the last value of session.pending
   * @param {Operation[]} merge - thee last value of session.merge
   * @param {int} version - the last value of version
   * @returns {Session}
   */
  withPending(pending, merge, version) {
    this._unsent = pending || [];
    this._merge = (merge || []).slice(0);
    this._unacked = this._unsent.slice(0);
    this._version = version;
    return this;
  }

  get pending() {
    return this._unacked.slice(0);
  }

  get merge() {
    return this._merge.slice(0);
  }

  get version() {
    return this._version;
  }

  withStream(stream) {
    this._stream = stream;
    return this;
  }

  get stream() {
    return this._stream;
  }

  /** pull fetches server side ops and applies them to the stream
   *
   * if a call is in progress, returns the last promise.
   * @param {Conn|Transformer} conn -- the connection to use
   * @return {Promise}
   */
  pull(conn) {
    // apply server side changes
    for (let op of this._unmerged) {
      if (this._unacked.length && this._unacked[0].id == op.id) {
        this._unacked.shift();
        this._merge.shift();
      } else {
        for (let kk = 0; kk < this._merge.length; kk++) {
          [this._merge[kk], op] = op.merge(this._merge[kk]);
        }
        this._stream = this._stream.reverseAppend(op.changes);
      }
      this._version = op.version;
    }
    this._unmerged = [];

    const now = this._now();

    if (this._reading || now < this._pauseReadUntil) {
      return this._reading || Promise.resolve(null);
    }

    this._pauseReadUntil = now + 10 * 1000; // 10s
    return (this._reading = conn
      .read(this._version + 1, 1000)
      .then(ops => {
        this._unmerged = this._unmerged.concat(ops || []);
        this._reading = null;
        this._pauseReadUntil = 0;
      })
      .catch(err => {
        this._log.error("read failed", err);
        this._reading = null;
      }));
  }

  /** push takes all local changes and sends them upstream
   *
   * if a call is in progress, returns the last promise.
   * @param {Conn|Transformer} conn -- the connection to use
   * @return {Promise}
   */
  push(conn) {
    // push client side changes
    let s = this._stream;
    for (let next = s.next; next != null; next = next.version.next) {
      const pid = this._parentId();
      const op = new Operation(null, pid, -1, this._version, next.change);
      this._unsent.push(op);
      this._unacked.push(op);
      s = next.version;
    }
    this._stream = s;

    const now = this._now();
    const paused = this._writing || now < this._pauseWriteUntil;

    if (paused || this._unsent.length == 0) {
      return this._writing || Promise.resolve(null);
    }

    this._pauseWriteUntil = now + 10 * 1000; // 30s
    const ops = this._unsent.slice(0);
    return (this._writing = conn
      .write(ops)
      .then(() => {
        for (let count = 0; count < ops.length; count++) {
          this._unsent.shift();
        }
        this._writing = null;
        this._pauseWriteUntil = 0;
      })
      .catch(err => {
        this._log.error("write failed", err);
        this._writing = null;
      }));
  }

  _parentId() {
    const len = this._unacked.length;
    return len > 0 ? this._unacked[len - 1].id : null;
  }
}
