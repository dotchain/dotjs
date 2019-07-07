// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Null, Atomic, Replace, Decoder } from "../../index.js";

describe("Atomic", () => {
  it("should ignore empty changes", () => {
    let n = new Atomic(5);
    expect(n.apply()).to.equal(n);
  });

  it("should succeed with simple replace", () => {
    const before = new Atomic(null);
    const repl = new Replace(before, new Atomic(5));
    expect(before.apply(repl)).to.equal(repl.after);
  });
});

describe("Atomic - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Atomic())).to.equal("[null]");
    expect(JSON.stringify(new Atomic(new Null()))).to.equal(
      '[{"changes.empty":[]}]'
    );
  });

  it("should deserialize", () => {
    const d = new Decoder();
    expect(Atomic.fromJSON(d, [null])).to.deep.equal(new Atomic());
    expect(Atomic.fromJSON(d, [{ "changes.empty": [] }])).to.deep.equal(
      new Atomic(new Null())
    );
  });
});
