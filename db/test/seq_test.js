// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Decoder } from "../decode.js";
import { Replace } from "../replace.js";
import { Move } from "../move.js";
import { PathChange } from "../path_change.js";
import { Splice } from "../splice.js";
import { Changes } from "../changes.js";
import { Text, Seq, Stream, SeqIterator } from "../index.js";

describe("Seq stream", () => {
  it("should converge", () => {
    const s = new Seq([new Text("hello"), new Text("world")]).setStream(
      new Stream()
    );

    const hello = s.get(0);
    const h2 = hello.splice(5, 0, " world");

    expect(h2.text).to.equal("hello world");
    expect(hello.next.version.text).to.equal("hello world");
    expect(s.next.version.get(0).text).to.equal("hello world");
    expect(s.next.version.get(1).text).to.equal("world");
  });

  it("should iterate", () => {
    const s = new Seq([new Text("hello"), new Text("world")]);
    let count = 0;
    for (let value of s[SeqIterator]()) {
      expect(s.get(count).text).to.equal(value.text);
      count++;
    }
    expect(count).to.equal(2);
  });

  it("should track index with splice", () => {
    let s = new Seq([new Text("hello"), new Text("world")]).setStream(
      new Stream()
    );

    let item = s.get(1);

    s = s.splice(0, 0, new Seq([new Text("something")]));
    item = item.replace(new Text("new world"));

    s = s.latest();

    expect(s.get(2).text).to.equal(item.text);
  });
});

describe("Seq value", () => {
  it("should ignore empty changes", () => {
    let n = new Seq();
    expect(n.apply()).to.deep.equal(n);
  });

  it("should apply Replace", () => {
    const before = new Seq();
    const repl = new Replace(before, new Text("a"));
    expect(before.apply(repl)).to.equal(repl.after);
    let alt = new PathChange(null, repl);
    expect(before.apply(alt)).to.equal(repl.after);
    alt = new Changes(repl);
    expect(before.apply(alt)).to.equal(repl.after);
  });

  it("should apply Splice", () => {
    const before = new Seq([new Text("hello")]);
    const after = new Seq([new Text("hello"), new Text("world")]);
    const splice = new Splice(1, new Seq(), new Seq([new Text("world")]));
    expect(before.apply(splice)).to.deep.equal(after);
  });

  it("should apply move", () => {
    const before = new Seq([1, 2, 3, 4, 5].map(n => new Text(n.toString())));
    const after = new Seq([2, 3, 4, 1, 5].map(n => new Text(n.toString())));
    const move = new Move(1, 3, -1);
    expect(before.apply(move)).to.deep.equal(after);
  });

  it("should apply PathChange", () => {
    const repl = new Replace(new Text("boo"), new Text("hoo"));
    const c = new PathChange([1], repl);
    const before = new Seq([new Text("hey"), new Text("boo")]);
    const expected = new Seq([new Text("hey"), new Text("hoo")]);
    expect(before.apply(c)).to.deep.equal(expected);
  });
});

describe("Seq - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Seq())).to.equal("[]");
    expect(JSON.stringify(new Seq([]))).to.equal("[]");
    expect(
      JSON.stringify(new Seq([new Text("hello"), new Text("world")]))
    ).to.equal('[{"dotdb.Text":"hello"},{"dotdb.Text":"world"}]');
  });

  it("should deserialize", () => {
    const decoded = new Decoder().decodeValue({ "dotdb.Seq": [] });
    expect(decoded).to.deep.equal(new Seq());

    const decoded2 = new Decoder().decodeValue({ "dotdb.Seq": null });
    expect(decoded2).to.deep.equal(new Seq());

    const expected = new Seq([new Text("hello"), new Text("world")]);
    const json = JSON.parse(JSON.stringify(expected));
    expect(Seq.fromJSON(new Decoder(), json)).to.deep.equal(expected);
  });
});
