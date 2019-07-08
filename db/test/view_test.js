// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  View,
  Field,
  Dict,
  Ref,
  Store,
  Stream,
  Text,
  Null,
  run
} from "../index.js";

describe("View", () => {
  function newStore() {
    const s = new Store().setStream(new Stream());
    const table1 = s.get("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({ col1: new Text("hello") });
    const row2 = new Dict({ col1: new Ref(["table1", "row1"]) });
    const view = new View(
      new Dict({
        viewFn: new Field(),
        obj: new Ref(["table1", "row2", "col1"]),
        field: new Text("col1")
      })
    );
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    table1.get("view").replace(view);

    return s.next.version.next.version.next.version;
  }

  it("should evaluate", () => {
    const s = newStore();
    const v = run(s, s.get("table1").get("view"));
    expect(v.text).to.equal("hello");
  });

  it("should track object", () => {
    const s = newStore();
    const v = run(s, s.get("table1").get("view"));
    s.get("table1")
      .get("row1")
      .get("col1")
      .replace(new Text("world"));

    expect(v.next.version.text).to.equal("world");
  });

  it("should track field", () => {
    const s = newStore();
    const v = run(s, s.get("table1").get("view"));
    s.get("table1")
      .get("view")
      .get("info")
      .get("field")
      .replace(new Text("col2"));

    expect(v.next.version).to.be.an.instanceof(Null);
  });
});
