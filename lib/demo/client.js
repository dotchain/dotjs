// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import crypto from "crypto";
import fetch from "node-fetch";
import { Session, Conn, decode, TextStream, Operation } from "../index.js";

function main() {
  Operation.useCrypto(crypto);

  const url = "http://localhost:8089/dotjs/";
  const conn = new Conn(url, fetch);
  const session = new Session().withLog(console);
  let val = new TextStream("", session.stream);
  const ping = function() {
    session
      .push(conn)
      .then(() => session.pull(conn))
      .then(() => {
        const before = val.latest();
        val = before.replace(new Date().toString());
        console.log(before.value, "=>", val.value);
      });
    setTimeout(ping, 1000);
  };

  ping();
}

main();
