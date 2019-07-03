// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Dict, Store, Text } from "../../db/index.js";

describe("Store", () => {
  it("should converge", () => {
    let s = new Store(new FakeConn(), null);
    const table1 = s.collection("table1");

    // add a row!
    const row1 = new Dict({ col1: new Text("hello") });
    table1.get("row1").replace(row1);

    // now get latest root and make sure the row exists
    s = s.next.version;
    expect(
      s
        .collection("table1")
        .get("row1")
        .get("col1").text
    ).to.equal("hello");

    // hello => hello world
    s.collection("table1")
      .get("row1")
      .get("col1")
      .splice(5, 0, " world");

    // validate!
    s = s.next.version;
    expect(
      s
        .collection("table1")
        .get("row1")
        .get("col1").text
    ).to.equal("hello world");
  });
});

class FakeConn {
  constructor() {
    this._resolveRead = null;
    this._rejectRead = null;
    this._resolveWrite = null;
    this._rejectWrite = null;
  }

  read(/* version, limit */) {
    return new Promise((resolve, reject) => {
      this._resolveRead = resolve;
      this._rejectRead = reject;
    });
  }

  write(/* ops */) {
    return new Promise((resolve, reject) => {
      this._resolveWrite = resolve;
      this._rejectWrite = reject;
    });
  }
}
