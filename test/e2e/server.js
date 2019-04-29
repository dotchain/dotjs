// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

// This file is loaded by e2e tests but locally (i.e. not within the
// browser).
// A dummy server is created here so that the e2e test can run against
// it.  The dummy server uses express

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Server } from "../../index.js";

function main() {
  const app = express();
  const eps = {};

  app.options("/dotjs/:ep", cors());
  app.post("/dotjs/:ep", cors(), (req, res, next) => {
    if (!eps[req.params.ep]) {
      eps[req.params.ep] = new Server(new InMemConn(), bodyParser);
    }
    eps[req.params.ep].handle(req, res, next);
  });

  app.listen(8089, "localhost", () => {});
}

class InMemConn {
  constructor() {
    this.ops = [];
    this.pending = () => null;
  }

  read(version, limit, duration) {
    if (version < this.ops.length) {
      const ops = [];
      for (let count = 0; count + version < this.ops.length; count++) {
        ops.push(this.ops[version + count]);
      }
      return Promise.resolve(ops);
    }

    if (duration < 0) {
      return Promise.resolve(null);
    }

    duration = duration || 30 * 1000;
    const timeout = new Promise(resolve => {
      setTimeout(() => resolve(null), duration);
    });

    const wait = new Promise(resolve => {
      const pending = this.pending;
      this.pending = () => {
        pending();
        this.read(version, limit, -1).then(resolve);
      };
    });

    return Promise.race([timeout, wait]);
  }

  write(ops) {
    for (let op of ops) {
      let found = false;
      for (let existing of this.ops) {
        if (op.id == existing.id) {
          found = true;
          break;
        }
      }
      if (!found) {
        op.version = this.ops.length;
        this.ops.push(op);
      }
    }

    const pending = this.pending;
    this.pending = () => {};
    pending();

    return Promise.resolve(null);
  }
}

main();

