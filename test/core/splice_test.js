// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Null, Text, Replace, Splice, Decoder } from "../../index.js";
import compactSpliceInfo from "./testdata/splices.js";

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

describe("Splice - dataset tests", () => {
  let count = 0;

  for (let test of compactSpliceInfo.test) {
    count++;

    const [before, after, [left], [right], [leftx], [rightx]] = test;

    it(count.toString() + ": " + left + " x " + right, () => {
      const l = parse(before, after, left);
      const r = parse(before, after, right);
      const lx = parse(before, after, leftx);
      const rx = parse(before, after, rightx);

      expect(l.merge(r).map(simplify)).to.deep.equal([lx, rx].map(simplify));
      expect(r.reverseMerge(l).map(simplify)).to.deep.equal(
        [rx, lx].map(simplify)
      );
      expect(new Text(before).apply(l).apply(lx)).to.deep.equal(
        new Text(after)
      );
      expect(new Text(before).apply(r).apply(rx)).to.deep.equal(
        new Text(after)
      );
    });
  }

  function simplify(c) {
    if (
      c instanceof Splice &&
      JSON.stringify(c.before) == JSON.stringify(c.after)
    ) {
      return null;
    }
    return c;
  }

  function parse(before, after, x) {
    if (!x) {
      return null;
    }

    const l = x.indexOf("(");
    const r = x.indexOf(")");
    const mid = x.slice(l + 1, r);
    const [midl, midr] = mid.split("=");
    return new Splice(l, new Text(midl), new Text(midr));
  }
});
