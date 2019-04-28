// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Null, Text, Replace, Splice, Decoder } from "../../index.js";

describe("Splice", () => {
  it("reverts", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    const expected = new Splice(splice.offset, splice.after, splice.before);
    expect(splice.revert()).to.deep.equal(expected);
  });

  it("merges with null", () => {
    const splice = new Splice(5, new Text("hello"), new Text("world"));
    expect(splice.merge(null)).to.deep.equal([null, splice]);
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
    const remove = new Replace(new Text("01234hello"), new Text("boo"));
    const expected = new Replace(new Text("01234world"), new Text("boo"));
    expect(splice.merge(remove)).to.deep.equal([expected, null]);
    expect(splice.reverseMerge(remove)).to.deep.equal([expected, null]);
  });
});

describe("Splice - interop serialization", () => {
  it("should serialize", () => {
    const splice = new Splice(5, new Text("boo"), new Text("hoo"));
    expect(JSON.stringify(splice)).to.equal(
      '[5,{"types.S16":"boo"},{"types.S16":"hoo"}]'
    );
  });

  it("should deserialize", () => {
    const splice = new Splice(5, new Text("boo"), new Text("hoo"));
    const json = JSON.parse(JSON.stringify(splice));
    expect(Splice.fromJSON(new Decoder(), json)).to.deep.equal(splice);
  });
});
