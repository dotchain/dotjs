// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Replace } from "../replace.js";
import { PathChange } from "../path_change.js";
import { Changes } from "../changes.js";
import { Decoder } from "../decode.js";
import { Null, Num, Dict, Text, Stream, MapIterator } from "../index.js";

describe("Dict stream", () => {
  it("should converge", () => {
    const d = new Dict({ hello: new Text("world") });
    d.stream = new Stream();

    const hello = d.get("hello");
    const h2 = hello.splice(5, 0, "!");

    expect(h2.text).to.equal("world!");
    expect(hello.next.version.text).to.equal("world!");
    expect(d.next.version.get("hello").text).to.equal("world!");
  });

  it("should converge with defaults", () => {
    // missing keys are all assumed to contain {w: "world"}
    const d = new Dict({}, () => new Dict({ w: new Text("world") }));
    d.stream = new Stream();

    const h1 = d.get("hello");
    const h2 = d.get("hello");

    const h1x = h1.get("w").splice(5, 0, "!");
    expect(h1x.text).to.equal("world!");

    const d2 = d.next.version;
    expect(d2.get("hello").get("w").text).to.equal("world!");

    const h2x = h2.next.version.get("w");
    expect(h2x.text).to.equal("world!");
  });

  it("should iterate", () => {
    const d = new Dict({ hello: new Text("one"), world: new Text("two") });
    let count = 0;
    for (let [key, value] of d[MapIterator]()) {
      expect(d.get(key).text).to.equal(value.text);
      count++;
    }
    expect(count).to.equal(2);
  });
});

describe("Dict", () => {
  it("should ignore empty changes", () => {
    let n = new Dict();
    expect(n.apply().map).to.equal(n.map);
  });

  it("should immutably set keys", () => {
    const n = new Dict().setStream(new Stream());
    const njson = JSON.stringify(n);
    n.get("hello").replace(new Num(5));
    expect(njson).to.equal(JSON.stringify(n));
    expect(+n.next.version.get("hello")).to.equal(5);
  });

  it("should immutably delete keys", () => {
    let n = new Dict().setStream(new Stream());
    let njson = JSON.stringify(n);
    n.get("hello").replace(new Num(5));
    let n2 = n.next.version;
    n2.get("hello").replace(new Null());
    let n3 = n2.next.version;

    expect(JSON.stringify(n3)).to.deep.equal(njson);
    expect(njson).to.equal(JSON.stringify(n));
    expect(+n2.get("hello")).to.equal(5);
  });

  it("should apply Replace", () => {
    const before = new Dict();
    const repl = new Replace(before, new Num(5));
    expect(before.apply(repl)).to.equal(repl.after);
    let alt = new PathChange(null, repl);
    expect(before.apply(alt)).to.equal(repl.after);
    alt = new Changes(repl);
    expect(before.apply(alt)).to.equal(repl.after);
  });

  it("should apply PathChange create", () => {
    const repl = new Replace(new Null(), new Num(5));
    const c = new PathChange(["boo"], repl);
    const before = new Dict();
    const expected = new Dict({ boo: repl.after });
    expect(before.apply(c).map).to.deep.equal(expected.map);
  });

  it("should apply PathChange update", () => {
    const repl = new Replace(new Num(9), new Num(5));
    const c = new PathChange(["boo"], repl);
    const before = new Dict({ boo: repl.before });
    const expected = new Dict({ boo: repl.after });
    expect(before.apply(c).map).to.deep.equal(expected.map);
  });

  it("should apply PathChange remove", () => {
    const repl = new Replace(new Num(9), new Null());
    const c = new PathChange(["boo"], repl);
    const before = new Dict({ boo: repl.before });
    const expected = new Dict();
    expect(before.apply(c).map).to.deep.equal(expected.map);
  });
});

describe("Dict - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Dict())).to.equal("[]");
    expect(JSON.stringify(new Dict([]))).to.equal("[]");
    expect(
      JSON.stringify(
        new Dict({
          q: new Text("q"),
          s: new Text("p")
        })
      )
    ).to.equal('["q",{"dotdb.Text":"q"},"s",{"dotdb.Text":"p"}]');
  });

  it("should deserialize", () => {
    const decoded = new Decoder().decodeValue({ "dotdb.Dict": [] });
    expect(decoded.map).to.deep.equal(new Dict().map);

    let json = ["q", { "dotdb.Text": "q" }, "s", { "dotdb.Text": "p" }];
    expect(JSON.stringify(Dict.fromJSON(new Decoder(), json))).to.deep.equal(
      JSON.stringify(new Dict({ q: new Text("q"), s: new Text("p") }))
    );
  });
});
