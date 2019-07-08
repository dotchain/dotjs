// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Dict, Ref, Store, Stream, Text, Field, Null } from "../index.js";

describe("Field", () => {
  function newStore() {
    const s = new Store().setStream(new Stream());
    const table1 = s.get("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({ col1: new Text("hello") });
    const row2 = new Dict({ col1: new Ref(["table1", "row1"]) });
    const args = new Dict({
      obj: new Ref(["table1", "row2", "col1"]),
      field: new Text("col1")
    });
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    table1.get("args").replace(args);
    return s.next.version.next.version.next.version;
  }

  it("should invoke", () => {
    const s = newStore();
    const fn = new Field();
    const f = fn.invoke(s, s.get("table1").get("args"));
    expect(f.text).to.equal("hello");
  });

  it("should track object", () => {
    const s = newStore();
    const fn = new Field();
    const f = fn.invoke(s, s.get("table1").get("args"));
    s.get("table1")
      .get("row1")
      .get("col1")
      .replace(new Text("world"));

    expect(f.latest().text).to.equal("world");
  });

  it("should track field", () => {
    const s = newStore();
    const fn = new Field();
    const f = fn.invoke(s, s.get("table1").get("args"));
    s.get("table1")
      .get("args")
      .get("field")
      .replace(new Text("col2"));

    expect(f.latest()).to.be.an.instanceof(Null);
  });

  it("should proxy changes", () => {
    const s = newStore();
    const fn = new Field();
    const f = fn.invoke(s, s.get("table1").get("args"));
    f.replace(new Text("world"));

    expect(
      s
        .get("table1")
        .get("row1")
        .get("col1")
        .latest().text
    ).to.equal("world");
  });
});
