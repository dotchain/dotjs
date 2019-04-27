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
  }

  write(ops) {
    return this._request(new AppendRequest(ops));
  }

  read(version, limit) {
    const duration = 30 * 1000 * 1000 * 1000;
    return this._request(new GetSinceRequest(version, 1000, duration));
  }

  static async _request(url, fetch, req) {
    const headers = { "Content-Type": " application/x-sjson" };
    const body = JSON.stringify(Encoder.encode(req));

    const res = await fetch(url, { method: "POST", body, headers });
    if (!res.ok) {
      return Promise.reject(res.status + " " + res.statusText);
    }
    const json = await res.json();
    const r = Response.fromJSON(new Decoder(), json[Response.typeName()]);
    return r.err || (r.ops && r.ops.length && r.ops) || null;
  }
}
