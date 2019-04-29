// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder, Decoder } from "../core/index.js";
import { Operation } from "./op.js";
import { AppendRequest, GetSinceRequest } from "./request.js";
import { Response } from "./response.js";

export class Conn {
  constructor(url, fetch) {
    this._request = Conn._request.bind(null, url, fetch);
    this._limit = 1000;
    this._duration = 30 * 1000 * 1000 * 1000;
  }

  withPollMilliseconds(ms) {
    this._duration = ms * 1000 * 1000;
    return this;
  }

  write(ops) {
    return this._request(new AppendRequest(ops));
  }

  read(version, limit) {
    return this._request(new GetSinceRequest(version, limit, this._duration));
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
