// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  PathChange,
  Replace,
  Move,
  Changes,
  Text,
  Decoder
} from "../../index.js";

describe("Move", () => {
  it("reverts", () => {
    const initial = new Text("abc12def");
    const move1 = new Move(3, 2, -1);
    const reverted = move1.revert();
    expect(initial.apply(move1).apply(reverted)).to.deep.equal(initial);
    expect(reverted.revert()).to.deep.equal(move1);
  });

  it("merges with null", () => {
    const move = new Move(1, 2, 3);
    expect(move.merge(null)).to.deep.equal([null, move]);
  });

  it("merges with replace", () => {
    const move = new Move(1, 2, 3);
    const replace = new Replace(new Text("before"), new Text("after"));
    const expected = new Replace(replace.before.apply(move), replace.after);
    expect(move.merge(replace)).to.deep.equal([expected, null]);
  });

  it("merges with pathchange", () => {
    const move = new Move(1, 2, 3);
    const inner = new Replace(new Text("before"), new Text("after"));
    const indexMap = { 0: 0, 1: 4, 2: 5, 3: 1, 4: 2, 5: 3, 6: 6 };
    for (let idx in indexMap) {
      const pc = new PathChange([+idx], inner);
      const expected = new PathChange([indexMap[idx]], inner);
      expect(move.merge(pc)).to.deep.equal([expected, move]);
    }
  });

  it("merges with changeset", () => {
    const move = new Move(1, 2, 3);
    const pc = new PathChange(
      [100],
      new Replace(new Text("before"), new Text("after"))
    );
    const cs = new Changes([pc, pc]);
    expect(move.merge(cs)).to.deep.equal([cs, move]);
  });

  it("merges with splice", () => {});
});

describe("Move - interop serialization", () => {
  it("should serialize", () => {
    const move = new Move(1, 2, 3);
    expect(JSON.stringify(move)).to.equal("[1,2,3]");
  });

  it("should deserialize", () => {
    const move = new Move(1, 2, 3);
    const json = JSON.parse(JSON.stringify(move));
    expect(Move.fromJSON(new Decoder(), json)).to.deep.equal(move);
  });
});
