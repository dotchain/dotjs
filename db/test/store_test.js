// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Dict, Store, Stream, Text } from "../index.js";

describe("Store", () => {
  it("should converge", () => {
    let s = new Store().setStream(new Stream());
    const table1 = s.get("table1");

    // add a row!
    const row1 = new Dict({ col1: new Text("hello") });
    table1.get("row1").replace(row1);

    // now get latest root and make sure the row exists
    s = s.next.version;
    expect(
      s
        .get("table1")
        .get("row1")
        .get("col1").text
    ).to.equal("hello");

    // hello => hello world
    s.get("table1")
      .get("row1")
      .get("col1")
      .splice(5, 0, " world");

    // validate!
    s = s.next.version;
    expect(
      s
        .get("table1")
        .get("row1")
        .get("col1").text
    ).to.equal("hello world");

    expect(s).to.be.instanceOf(Store);
  });
});
