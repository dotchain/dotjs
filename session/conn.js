// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { encode, decodeChange } from "../core";
import { Operation } from "./op.js";
import { AppendRequest, GetSinceRequest } from "./request.js";
import { Response } from "./response.js";

export class Conn {
  constructor(url, fetch, decoder) {
    this._request = Conn._request.bind(null, url, fetch, decoder);
  }

  write(ops) {
    return this._request(new AppendRequest(ops));
  }

  read(version, limit) {
    const duration = 30 * 1000 * 1000 * 1000;
    return this._request(new GetSinceRequest(version, 1000, duration));
  }

  static _request(url, fetch, decoder, req) {
    const headers = { "Content-Type": " application/x-sjson" };
    const opsOrNull = ops => (ops && ops.length > 0 ? ops : null);
    return fetch(url, { method: "POST", body: encode(req), headers })
      .then(res =>
        res.ok ? res : Promise.reject(res.status + " " + res.statusText)
      )
      .then(res => res.json())
      .then(json => Response.fromJSON(decoder, json[Response.typeName()]))
      .then(r => (r.err ? Promise.reject(r.err) : opsOrNull(r.ops)));
  }
}
