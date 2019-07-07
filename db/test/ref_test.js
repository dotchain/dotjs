// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Dict, Ref, Store, Text, run } from "../index.js";

describe("Ref", () => {
  it("should run", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({ col1: new Text("hello") });
    const row2 = new Dict({ col1: new Ref(["table1", "row1", "col1"]) });
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);

    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    let deref = run(
      s,
      s
        .collection("table1")
        .get("row2")
        .get("col1")
    );
    expect(deref.text).to.equal("hello");
  });

  it("should track changes in underlying object", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({ col1: new Text("hello") });
    const row2 = new Dict({ col1: new Ref(["table1", "row1", "col1"]) });
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    let deref = run(
      s,
      s
        .collection("table1")
        .get("row2")
        .get("col1")
    );

    // now updated hello => hello world and see the ref update
    s.collection("table1")
      .get("row1")
      .get("col1")
      .splice(5, 0, " world");
    deref = deref.next.version;
    expect(deref.text).to.equal("hello world");
  });

  it("should update if the ref itself changes", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({
      col1: new Text("hello"),
      col2: new Text("world")
    });
    const row2 = new Dict({ col1: new Ref(["table1", "row1", "col1"]) });
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    const ref = s
      .collection("table1")
      .get("row2")
      .get("col1");
    let deref = run(s, ref);

    // now update col1 => col2 and see hello => world
    s.collection("table1")
      .get("row2")
      .get("col1")
      .replace(new Ref(["table1", "row1", "col2"]));

    deref = deref.next.version;
    expect(deref.text).to.equal("world");
  });

  it("should proxy changes", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({
      col1: new Text("hello"),
      col2: new Text("world")
    });
    const row2 = new Dict({ col1: new Ref(["table1", "row1", "col1"]) });
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    const ref = s
      .collection("table1")
      .get("row2")
      .get("col1");
    const deref = run(s, ref);

    // edit deref and see it properly proxied
    deref.splice(5, 0, " world");

    s = s.next.version;
    expect(
      s
        .collection("table1")
        .get("row1")
        .get("col1").text
    ).to.equal("hello world");
  });

  it("should allow replacing a ref with a non-ref", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({ col1: new Text("hello") });
    const row2 = new Dict({ col1: new Ref(["table1", "row1", "col1"]) });
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    const ref = s
      .collection("table1")
      .get("row2")
      .get("col1");
    const deref = run(s, ref);

    // replace ref with text and see the update take hold
    ref.replace(new Text("world"));

    s = s.next.version;
    expect(
      s
        .collection("table1")
        .get("row2")
        .get("col1").text
    ).to.equal("world");
    expect(deref.next.version.text).to.equal("world");
  });
});
