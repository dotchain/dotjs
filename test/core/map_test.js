// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  Map,
  Null,
  Atomic,
  Replace,
  PathChange,
  Decoder
} from "../../index.js";

describe("Map", () => {
  it("should ignore empty changes", () => {
    let n = new Map();
    expect(n.apply()).to.equal(n);
  });

  it("should immutably set keys", () => {
    let n = new Map();
    let njson = JSON.stringify(n);
    let n2 = n.set(5, new Atomic(5));
    expect(njson).to.equal(JSON.stringify(n));
    expect(n2.get(5)).to.deep.equal(new Atomic(5));
  });

  it("should immutably delete keys", () => {
    let n = new Map();
    let njson = JSON.stringify(n);
    let n2 = n.set(5, new Atomic(5));
    let n3 = n2.set(5, new Null());
    expect(n3).to.deep.equal(n);
    expect(njson).to.equal(JSON.stringify(n));
    expect(n2.get(5)).to.deep.equal(new Atomic(5));
  });

  it("should apply Replace", () => {
    const before = new Map();
    const repl = new Replace(before, new Atomic(5));
    expect(before.apply(repl)).to.equal(repl.after);
  });

  it("should apply PathChange create", () => {
    const repl = new Replace(new Null(), new Atomic(5));
    const c = new PathChange(["boo"], repl);
    const before = new Map();
    const expected = new Map().set("boo", repl.after);
    expect(before.apply(c)).to.deep.equal(expected);
  });

  it("should apply PathChange update", () => {
    const repl = new Replace(new Atomic("hoo"), new Atomic(5));
    const c = new PathChange(["boo"], repl);
    const before = new Map().set("boo", repl.before);
    const expected = new Map().set("boo", repl.after);
    expect(before.apply(c)).to.deep.equal(expected);
  });

  it("should apply PathChange remove", () => {
    const repl = new Replace(new Atomic("hoo"), new Null());
    const c = new PathChange(["boo"], repl);
    const before = new Map().set("boo", repl.before);
    const expected = new Map();
    expect(before.apply(c)).to.deep.equal(expected);
  });
});

describe("Map - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Map())).to.equal("[]");
    expect(JSON.stringify(new Map([]))).to.equal("[]");
    expect(JSON.stringify(new Map([[2, "q"], ["s", "p"]]))).to.equal(
      '[{"int":2},{"string":"q"},{"string":"s"},{"string":"p"}]'
    );
  });

  it("should deserialize", () => {
    const decoded = new Decoder().decodeValue({ "changes/types.M": [] });
    expect(decoded).to.deep.equal(new Map());

    let json = [
      { int: 2 },
      { "changes.empty": [] },
      { string: "s" },
      { "changes.empty": [] }
    ];
    expect(Map.fromJSON(new Decoder(), json)).to.deep.equal(
      new Map([[2, new Null()], ["s", new Null()]])
    );
  });
});
