// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  List,
  Replace,
  Splice,
  Move,
  Text,
  PathChange,
  Changes,
  Decoder
} from "../../index.js";

describe("List", () => {
  it("should ignore empty changes", () => {
    let n = new List();
    expect(n.apply()).to.equal(n);
  });

  it("should immutably set items", () => {
    const n = new List([new Text("a"), new Text("b")]);
    const njson = JSON.stringify(n);
    const n2 = n.set(1, new Text("A"));
    expect(njson).to.equal(JSON.stringify(n));
    expect(n2.get(1)).to.deep.equal(new Text("A"));
    expect(n2).to.deep.equal(new List([new Text("a"), new Text("A")]));
  });

  it("should apply Replace", () => {
    const before = new List();
    const repl = new Replace(before, new Text("a"));
    expect(before.apply(repl)).to.equal(repl.after);
    let alt = new PathChange(null, repl);
    expect(before.apply(alt)).to.equal(repl.after);
    alt = new Changes(repl);
    expect(before.apply(alt)).to.equal(repl.after);
  });

  it("should apply Splice", () => {
    const before = new List([new Text("hello")]);
    const after = new List([new Text("hello"), new Text("world")]);
    const splice = new Splice(1, new List(), new List([new Text("world")]));
    expect(before.apply(splice)).to.deep.equal(after);
  });

  it("should apply move", () => {
    const before = new List([1, 2, 3, 4, 5].map(n => new Text(n.toString())));
    const after = new List([2, 3, 4, 1, 5].map(n => new Text(n.toString())));
    const move = new Move(1, 3, -1);
    expect(before.apply(move)).to.deep.equal(after);
  });

  it("should apply PathChange", () => {
    const repl = new Replace(new Text("boo"), new Text("hoo"));
    const c = new PathChange([1], repl);
    const before = new List([new Text("hey"), new Text("boo")]);
    const expected = new List([new Text("hey"), new Text("hoo")]);
    expect(before.apply(c)).to.deep.equal(expected);
  });
});

describe("List - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new List())).to.equal("[]");
    expect(JSON.stringify(new List([]))).to.equal("[]");
    expect(
      JSON.stringify(new List([new Text("hello"), new Text("world")]))
    ).to.equal('[{"changes/types.S16":"hello"},{"changes/types.S16":"world"}]');
  });

  it("should deserialize", () => {
    const decoded = new Decoder().decodeValue({ "changes/types.A": [] });
    expect(decoded).to.deep.equal(new List());

    const decoded2 = new Decoder().decodeValue({ "changes/types.A": null });
    expect(decoded2).to.deep.equal(new List());

    const expected = new List([new Text("hello"), new Text("world")]);
    const json = JSON.parse(JSON.stringify(expected));
    expect(List.fromJSON(new Decoder(), json)).to.deep.equal(expected);
  });
});
