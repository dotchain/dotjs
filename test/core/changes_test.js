// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Null, Atomic, Replace, Changes } from "../../index.js";
import { FakeDecoder } from "./decoder_test.js";

describe("Changes", () => {
  it("reverts", () => {
    const r1 = new Replace(new Atomic(1), new Atomic(2));
    const r2 = new Replace(new Atomic(2), new Atomic(3));
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
    c = new Changes([new Replace(new Atomic(1), new Atomic(2))]);
    expect(c.merge(null)).to.deep.equal([null, c]);
  });

  it("merges with replaces", () => {
    const replace1 = new Replace(new Atomic(1), new Atomic(2));
    const replace2 = new Replace(new Atomic(2), new Atomic(3));
    const other = new Replace(new Atomic(1), new Atomic(0));

    const c = new Changes([replace1, replace2]);
    const got = c.merge(other);
    const expected = [new Replace(new Atomic(3), new Atomic(0)), null];

    expect(got).to.deep.equal(expected);

    const expected2 = [
      new Changes([new Replace(new Atomic(0), new Atomic(2)), replace2]),
      null
    ];
    expect(other.merge(c)).to.deep.equal(expected2);
    expect(c.reverseMerge(other)).to.deep.equal([expected2[1], expected2[0]]);
  });
});

describe("Changes - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Changes())).to.equal("[]");

    const replace = new Replace(new Null(), new Atomic(new Null()));
    expect(JSON.stringify(new Changes([replace]))).to.equal(
      '[{"changes.Replace":[{"changes.empty":[]},{"changes.Atomic":[{"changes.empty":[]}]}]}]'
    );
  });

  it("should deserialize", () => {
    const d = new FakeDecoder();
    expect(Changes.fromJSON(d, [])).to.deep.equal(null);

    const replace = new Replace(new Null(), new Atomic(new Null()));
    const json = [
      {
        "changes.Replace": [
          { "changes.empty": [] },
          { "changes.Atomic": [{ "changes.empty": [] }] }
        ]
      }
    ];
    expect(Changes.fromJSON(d, json)).to.deep.equal(new Changes([replace]));
  });
});
