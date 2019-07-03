// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Num, Stream } from "../../db/index.js";

describe("Num", () => {
  it("should ignore empty changes", () => {
    let n = new Num(5);
    expect(n.apply()).to.deep.equal(n);
  });

  it("should succeed with simple replace", () => {
    const before = new Num(5).setStream(new Stream());
    const after = before.replace(new Num(10));
    expect(+before.next.version).to.deep.equal(10);
    expect(+after).to.deep.equal(10);
  });

  it("should disallow non numbers", () => {
    let e = null;
    try {
      new Num("a");
    } catch (err) {
      e = err;
    }
    expect(e).to.not.equal(null);
  });
});

describe("Num - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Num(5))).to.equal("5");
  });

  it("should deserialize", () => {
    expect(Num.fromJSON(null, new Num(5).toJSON())).to.deep.equal(new Num(5));
  });
});
