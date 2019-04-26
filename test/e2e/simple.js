// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

/* eslint-env mocha, browser */

import { expect } from "chai";
import { Session, Conn, decode, Atomic, Map, MapStream } from "../../index.js";

describe("e2e serialization", () => {
  it("write op, read op", () => {
    const time = new Date().getTime();
    const url = "http://localhost:8089/dotjs/" + time;
    const conn = new Conn(url, fetch, new Decoder());
    const session = new Session().withLog(console);
    let val = new MapStream(new Map(), session.stream);
    val.set(42, new Map([["ok", new Atomic("hello")]]));

    return session
      .push(conn)
      .then(() => session.pull(conn))
      .then(() => {
        session.pull(conn);
        expect(session.version).to.equal(0);
        expect(session.pending.length).to.equal(0);
      });
  });
});

class Decoder {
  decode(json) {
    return decode(this, json);
  }
}
