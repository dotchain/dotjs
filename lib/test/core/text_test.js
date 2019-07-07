// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Text, Atomic, Replace, Splice, Move, Decoder } from "../../index.js";

describe("Text", () => {
  it("should ignore empty changes", () => {
    let t = new Text();
    expect(t.apply()).to.equal(t);
  });

  it("should succeed with simple replace", () => {
    const repl = new Replace(new Text(), new Atomic(5));
    const before = new Text();
    expect(before.apply(repl)).to.equal(repl.after);
  });

  it("should slice", () => {
    expect(new Text().slice(0, 0)).to.deep.equal(new Text());
    expect(new Text("hello").slice(3, 4)).to.deep.equal(new Text("l"));
  });

  it("should return length", () => {
    expect(new Text("hello").length).to.equal(5);
  });

  it("should support splice()", () => {
    const t = new Text("hello");
    const splice = new Splice(2, t.slice(2, 4), new Text("LL"));
    expect(t.apply(splice)).to.deep.equal(new Text("heLLo"));
  });

  it("should support move()", () => {
    const t = new Text("fargo");
    const move = new Move(3, 2, -3);
    expect(t.apply(move)).to.deep.equal(new Text("gofar"));
  });
});

describe("Text - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Text("boo"))).to.equal('"boo"');
  });

  it("should deserialize", () => {
    const d = new Decoder();
    const v = d.decodeValue({ "changes/types.S16": "boo" });

    expect(v).to.deep.equal(new Text("boo"));
  });
});
