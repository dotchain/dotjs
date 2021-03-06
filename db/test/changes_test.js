// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Null, Num } from "../index.js";
import { Changes } from "../changes.js";
import { Replace } from "../replace.js";
import { Decoder } from "../decode.js";

describe("Changes", () => {
  it("reverts", () => {
    const r1 = new Replace(new Num(1), new Num(2));
    const r2 = new Replace(new Num(2), new Num(3));
    const c = new Changes([r1, r2]);
    const expected = new Changes([r2.revert(), r1.revert()]);
    expect(c.revert()).to.deep.equal(expected);
  });

  it("reverts empty", () => {
    expect(new Changes().revert()).to.equal(null);
  });

  it("merges with null", () => {
    let c = new Changes();
    expect(c.merge(null)).deep.equal([null, c]);
    expect(c.reverseMerge(null)).deep.equal([null, c]);
    c = new Changes([new Replace(new Num(1), new Num(2))]);
    expect(c.merge(null)).to.deep.equal([null, c]);
    expect(c.reverseMerge(null)).deep.equal([null, c]);
  });

  it("merges with replaces", () => {
    const replace1 = new Replace(new Num(1), new Num(2));
    const replace2 = new Replace(new Num(2), new Num(3));
    const other = new Replace(new Num(1), new Num(0));

    const c = new Changes([replace1, replace2]);
    const got = c.merge(other);
    const expected = [new Replace(new Num(3), new Num(0)), null];

    expect(got).to.deep.equal(expected);

    const expected2 = [
      new Changes([new Replace(new Num(0), new Num(2)), replace2]),
      null
    ];
    expect(other.merge(c)).to.deep.equal(expected2);
    expect(c.reverseMerge(other)).to.deep.equal([expected2[1], expected2[0]]);
  });

  it("iterates", () => {
    let c = new Changes();
    for (let inner of c) {
      expect(inner).to.equal({});
    }
    const c1 = new Replace(new Num(1), new Num(2));
    const c2 = new Replace(new Num(2), new Num(3));
    c = new Changes(c1, [c2]);
    const expected = [c2, c1];
    for (let inner of c) {
      expect(inner).to.equal(expected.pop());
    }
    expect(expected).to.deep.equal([]);
  });
});

describe("Changes - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Changes())).to.equal("[]");

    const replace = new Replace(new Null(), new Num(5));
    expect(JSON.stringify(new Changes([replace]))).to.equal(
      '[{"changes.Replace":[{"changes.empty":[]},{"dotdb.Num":5}]}]'
    );
  });

  it("should deserialize", () => {
    const d = new Decoder();
    expect(Changes.fromJSON(d, [])).to.deep.equal(null);

    const replace = new Replace(new Null(), new Num(5));
    const json = [
      {
        "changes.Replace": [{ "changes.empty": [] }, { "dotdb.Num": 5 }]
      }
    ];
    expect(Changes.fromJSON(d, json)).to.deep.equal(new Changes([replace]));
  });
});
