// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder, Decoder } from "../core/index.js";
import { Operation } from "./op.js";
import { AppendRequest, GetSinceRequest } from "./request.js";
import { Response } from "./response.js";

/**
 * Conn creates a network connection or use with Session. See {@link Transformer}.
 */
export class Conn {
  /**
   * @param {string} url - url to post requests to
   * @param {function} fetch - window.fetch implementation or polyfill
   */
  constructor(url, fetch) {
    this._request = Conn._request.bind(null, url, fetch);
    this._limit = 1000;
    this._duration = 30 * 1000 * 1000 * 1000;
  }

  /** withPollMilliseconds specifies poll interval to pass on to server */
  withPollMilliseconds(ms) {
    this._duration = ms * 1000 * 1000;
    return this;
  }

  /**
   * write ops using fetch
   * @param [Operation[]] ops - ops to write
   * @returns {Promise}
   */
  write(ops) {
    return this._request(new AppendRequest(ops));
  }

  /**
   * read ops using fetch
   * @param [int] version - version of op to start fetching from
   * @param [limit] limit - max number of ops to fetch
   * @param [duration] duration - max long poll interval to pass to server
   * @returns {Promise}
   */
  read(version, limit, duration) {
    duration = duration || this._duration;
    return this._request(new GetSinceRequest(version, limit, duration));
  }

  static async _request(url, fetch, req) {
    const headers = { "Content-Type": " application/x-sjson" };
    const body = JSON.stringify(Encoder.encode(req));

    const res = await fetch(url, { method: "POST", body, headers });
    if (!res.ok) {
      return Promise.reject(new Error(res.status + " " + res.statusText));
    }
    const json = await res.json();
    const r = Response.fromJSON(new Decoder(), json[Response.typeName()]);
    if (r.err) {
      return Promise.reject(r.err);
    }

    return (r.ops && r.ops.length && r.ops) || null;
  }
}
