// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Dict } from "./dict.js";
import { Ref } from "./ref.js";
import { Store } from "./store.js";
import { Text } from "./text.js";

describe("Ref", () => {
  it("should eval", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({"col1": new Text("hello")});
    const row2 = new Dict({"col1": new Ref(["table1", "row1", "col1"])});
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
                           
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    let deref = s.collection("table1").get("row2").get("col1").eval(s);
    expect(deref.text).to.equal("hello");

  });

  it("should track changes in underlying object", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({"col1": new Text("hello")});
    const row2 = new Dict({"col1": new Ref(["table1", "row1", "col1"])});
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    let deref = s.collection("table1").get("row2").get("col1").eval(s); 

    // now updated hello => hello world and see the ref update
    s.collection("table1").get("row1").get("col1").splice(5, 0, " world");
    deref = deref.next.version;
    expect(deref.text).to.equal("hello world");
  });

  it("should update if the ref itself changes", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({
      "col1": new Text("hello"),
      "col2": new Text("world"),
    });
    const row2 = new Dict({"col1": new Ref(["table1", "row1", "col1"])});
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    const ref = s.collection("table1").get("row2").get("col1");
    let deref = ref.eval(s); 

    // now update col1 => col2 and see hello => world
    s.collection("table1").get("row2").get("col1").replace(
      new Ref(["table1", "row1", "col2"])
    );

    deref = deref.next.version;
    expect(deref.text).to.equal("world");
  });

  it("should proxy changes", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({
      "col1": new Text("hello"),
      "col2": new Text("world"),
    });
    const row2 = new Dict({"col1": new Ref(["table1", "row1", "col1"])});
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    const ref = s.collection("table1").get("row2").get("col1");
    const deref = ref.eval(s); 

    // edit deref and see it properly proxied
    deref.splice(5, 0, " world");

    s = s.next.version;
    expect(s.collection("table1").get("row1").get("col1").text)
      .to.equal("hello world");
  });

  it("should allow replacing a ref with a non-ref", () => {
    let s = new Store(null, null);
    const table1 = s.collection("table1");

    // add a row + a ref to a column in that row
    const row1 = new Dict({"col1": new Text("hello")});
    const row2 = new Dict({"col1": new Ref(["table1", "row1", "col1"])});
    table1.get("row1").replace(row1);
    table1.get("row2").replace(row2);
    s = s.next.version.next.version;

    // evaluate table1.row2.col1
    const ref = s.collection("table1").get("row2").get("col1");
    const deref = ref.eval(s); 

    // replace ref with text and see the update take hold
    ref.replace(new Text("world"));

    s = s.next.version;
    expect(s.collection("table1").get("row2").get("col1").text)
      .to.equal("world");
    expect(deref.next.version.text).to.equal("world");
  });
});
