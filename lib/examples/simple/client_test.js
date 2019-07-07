// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import fetch from "node-fetch";

import { startServer } from "./server.js";
import { Session, Conn, TextStream, Operation, Transformer } from "dotjs";

it("client example", () => {
  // this is only needed on nodejs.  on browsers, Operation
  // automatically uses window.crypto
  Operation.useCrypto(require("crypto"));
  const server = startServer();

  const url = "http://localhost:8077/dotjs/something";

  // start a session
  const conn = new Transformer(new Conn(url, fetch));
  const session = new Session().withLog(console);

  // connect that session to a text stream
  const text = new TextStream("hello", session.stream);

  // update that text stream
  text.splice(5, 0, " world!");

  // merge the session
  return session
    .push(conn)
    .then(() => session.pull(conn))
    .then(() => server.close());
});
