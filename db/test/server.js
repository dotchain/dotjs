// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "../encode.js";
import { Decoder } from "../decode.js";
import { Operation } from "../op.js";
import { AppendRequest, GetSinceRequest, Request } from "../request.js";
import { Response } from "../response.js";

//** Server wraps a {@link Conn} into an express middleware */
export class Server {
  /**
   * @param {Connn|Transformer} conn -- the connection to use as destination.
   * @param {Object} bodyParser -- use require("body-parser")
   */
  constructor(conn, bodyParser) {
    this._conn = conn;
    this._decoder = new Decoder();
    this._json = (req, res, next) => next();
    if (bodyParser) {
      this._json = bodyParser.json({ type: "application/x-sjson" });
    }
  }

  /**  the expressjs entrypoint */
  handle(req, res, next) {
    if (!req.is("application/x-sjson")) {
      const ct = req.get("Content-Type");
      return next(new Error("content-type is not application/x-sjson: " + ct));
    }
    this._json(req, res, err => {
      if (err) {
        next(err);
      } else {
        this.handleAfterParsingBody(req, res, next);
      }
    });
  }

  handleAfterParsingBody(req, res, next) {
    const response = (ops, err) => ({
      [Response.typeName()]: new Response(ops, err)
    });

    this.asyncHandle(req, res).then(
      ops => res.send(JSON.stringify(response(ops, null))),
      err => res.send(JSON.stringify(response(null, err)))
    );
  }

  async asyncHandle(req, res) {
    const r = Request.fromJSON(this._decoder, req.body[Request.typeName()]);
    if (r instanceof AppendRequest) {
      return this._conn.write(r.ops).then(() => null);
    } else {
      return this._conn.read(r.version, r.limit, r.duration);
    }
  }
}
