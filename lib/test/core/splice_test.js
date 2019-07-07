// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  Null,
  Text,
  List,
  PathChange,
  Replace,
  Changes,
  Splice,
  Decoder
} from "../../index.js";

describe("Splice", () => {
  it("reverts", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    const expected = new Splice(splice.offset, splice.after, splice.before);
    expect(splice.revert()).to.deep.equal(expected);
  });

  it("merges with null", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    expect(splice.merge(null)).to.deep.equal([null, splice]);
    expect(splice.reverseMerge(null)).to.deep.equal([null, splice]);
  });

  it("merges with delete", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    const remove = new Replace(new Text("01234hello"), new Null());
    const expected = new Replace(new Text("01234world"), new Null());
    expect(splice.merge(remove)).to.deep.equal([expected, null]);
    expect(splice.reverseMerge(remove)).to.deep.equal([expected, null]);
  });

  it("merges with replace", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    const replace = new Replace(new Text("01234hello"), new Text("boo"));
    const expected = new Replace(new Text("01234world"), new Text("boo"));
    expect(splice.merge(replace)).to.deep.equal([expected, null]);
    expect(splice.reverseMerge(replace)).to.deep.equal([expected, null]);
  });

  it("merges with changes", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    const r1 = new Replace(new Text("01234hello"), new Text("boo"));
    const r2 = new Replace(new Text("boo"), new Text("hoo"));
    const changes = new Changes([r1, r2]);
    const [l, r] = changes.reverseMerge(splice);
    expect(splice.merge(changes)).to.deep.equal([r, l]);
  });

  it("merges with empty path pathchange", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    const other = new PathChange(
      null,
      new Splice(5, new Text("hello"), new Text("world2"))
    );
    expect(splice.merge(other)).to.deep.equal(splice.merge(other.change));
    expect(splice.reverseMerge(other)).to.deep.equal(
      splice.reverseMerge(other.change)
    );
  });

  it("merges with PathChange, < offset", () => {
    const splice = new Splice(
      5,
      new List([new Text("boo")]),
      new List([new Text("hoo")])
    );
    const inner = new Replace(new Text("before"), new Text("after"));
    const pc = new PathChange([3], inner);
    expect(splice.merge(pc)).to.deep.equal([pc, splice]);
    expect(splice.reverseMerge(pc)).to.deep.equal([pc, splice]);
  });

  it("merges with PathChange, > end", () => {
    const splice = new Splice(5, new List([new Text("boo")]), new List());
    const inner = new Replace(new Text("before"), new Text("after"));
    const pc = new PathChange([10], inner);
    const expected = new PathChange([9], inner);
    expect(splice.merge(pc)).to.deep.equal([expected, splice]);
    expect(splice.reverseMerge(pc)).to.deep.equal([expected, splice]);
  });

  it("merges with PathChange, conflict", () => {
    const splice = new Splice(5, new List([new Text("boo")]), new List());
    const inner = new Replace(new Text("boo"), new Text("hoo"));
    const pc = new PathChange([5], inner);
    const expected = new Splice(5, new List([new Text("hoo")]), new List());
    expect(splice.merge(pc)).to.deep.equal([null, expected]);
    expect(splice.reverseMerge(pc)).to.deep.equal([null, expected]);
  });
});

describe("Splice - interop serialization", () => {
  it("should serialize", () => {
    const splice = new Splice(5, new Text("boo"), new Text("hoo"));
    expect(JSON.stringify(splice)).to.equal(
      '[5,{"changes/types.S16":"boo"},{"changes/types.S16":"hoo"}]'
    );
  });

  it("should deserialize", () => {
    const splice = new Splice(5, new Text("boo"), new Text("hoo"));
    const json = JSON.parse(JSON.stringify(splice));
    expect(Splice.fromJSON(new Decoder(), json)).to.deep.equal(splice);
  });
});
