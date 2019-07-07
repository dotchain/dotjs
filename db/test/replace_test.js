// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Decoder } from "../decode.js";
import { Replace } from "../replace.js";
import { Null, Num } from "../index.js";

describe("Replace", () => {
  it("reverts", () => {
    const replace = new Replace(new Null(), new Num(5));
    const expected = new Replace(replace.after, replace.before);
    expect(replace.revert()).to.deep.equal(expected);
  });

  it("merges with null", () => {
    const replace = new Replace(new Null(), new Num(5));
    expect(replace.merge(null)).to.deep.equal([null, replace]);
  });

  it("merges with another delete", () => {
    const replace1 = new Replace(new Num(4), new Null());
    const replace2 = new Replace(new Num(4), new Null());
    expect(replace1.merge(replace2)).to.deep.equal([null, null]);
  });

  it("merges with last writer wins", () => {
    const remove = new Replace(new Num(4), new Null());
    const replace1 = new Replace(new Num(4), new Num(5));
    const replace2 = new Replace(new Num(4), new Num(6));

    expect(remove.merge(replace1)).to.deep.equal([
      new Replace(new Null(), new Num(5)),
      null
    ]);
    expect(replace1.merge(remove)).to.deep.equal([
      new Replace(new Num(5), new Null()),
      null
    ]);
    expect(replace1.merge(replace2)).to.deep.equal([
      new Replace(new Num(5), new Num(6)),
      null
    ]);
  });
});

describe("Replace - interop serialization", () => {
  it("should serialize", () => {
    const replace = new Replace(new Null(), new Num(5));
    expect(JSON.stringify(replace)).to.equal(
      '[{"changes.empty":[]},{"dotdb.Num":5}]'
    );
  });

  it("should deserialize", () => {
    const replace = new Replace(new Null(), new Num(5));
    const json = JSON.parse(JSON.stringify(replace));
    expect(Replace.fromJSON(new Decoder(), json)).to.deep.equal(replace);
  });
});
