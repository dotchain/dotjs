// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Decoder } from "../../db/decode.js";
import { Replace } from "../../db/replace.js";
import { Move } from "../../db/move.js";
import { PathChange } from "../../db/path_change.js";
import { Changes } from "../../db/changes.js";
import { Text, Stream } from "../../db/index.js";

describe("Move", () => {
  it("reverts", () => {
    const initial = new Text("abc12def").setStream(new Stream());
    const moved = initial.move(3, 2, -1);
    moved.stream.append(initial.next.change.revert());
    const reverted = moved.next.version;
    expect(reverted.text).to.equal(initial.text);
    const undone = reverted.apply(moved.next.change.revert());
    expect(undone.text).to.equal(moved.text);
  });

  it("merges with null", () => {
    const move = new Move(1, 2, 3);
    expect(move.merge(null)).to.deep.equal([null, move]);
    expect(move.reverseMerge(null)).to.deep.equal([null, move]);
  });

  it("merges with replace", () => {
    const move = new Move(1, 2, 3);
    const replace = new Replace(new Text("before"), new Text("after"));
    const expected = new Replace(replace.before.apply(move), replace.after);
    expect(move.merge(replace)).to.deep.equal([expected, null]);
    expect(move.reverseMerge(replace)).to.deep.equal([expected, null]);
  });

  it("merges with pathchange", () => {
    const move = new Move(1, 2, 3);
    const inner = new Replace(new Text("before"), new Text("after"));
    const indexMap = { 0: 0, 1: 4, 2: 5, 3: 1, 4: 2, 5: 3, 6: 6 };
    for (let idx in indexMap) {
      const pc = new PathChange([+idx], inner);
      const expected = new PathChange([indexMap[idx]], inner);
      expect(move.merge(pc)).to.deep.equal([expected, move]);
      expect(move.reverseMerge(pc)).to.deep.equal([expected, move]);
    }
  });

  it("merges with empty path pathchange", () => {
    const move = new Move(1, 2, 3);
    const other = new PathChange(null, new Move(100, 2, 3));
    expect(move.merge(other)).to.deep.equal(move.merge(other.change));
    expect(move.reverseMerge(other)).to.deep.equal(
      move.reverseMerge(other.change)
    );
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
