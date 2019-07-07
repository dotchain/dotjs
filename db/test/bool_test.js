// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Bool, Stream } from "../index.js";

describe("Bool", () => {
  it("should ignore empty changes", () => {
    let b = new Bool(true);
    expect(b.apply()).to.deep.equal(b);
  });

  it("should succeed with simple replace", () => {
    const before = new Bool(true).setStream(new Stream());
    const after = before.replace(new Bool(false));
    expect(before.next.version.b).to.equal(false);
    expect(after.b).to.equal(false);
  });
});

describe("Bool - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Bool(true))).to.equal("true");
    expect(JSON.stringify(new Bool(false))).to.equal("false");
  });

  it("should deserialize", () => {
    expect(Bool.fromJSON(null, true)).to.deep.equal(new Bool(true));
    expect(Bool.fromJSON(null, false)).to.deep.equal(new Bool(false));
  });
});
