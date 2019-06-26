// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Encoder } from "../../db/encode.js";
import { Decoder } from "../../db/decode.js";
import { Replace } from "../../db/replace.js";
import { Num, Null, Stream } from "../../db/index.js";

describe("Null", () => {
  it("should ignore empty changes", () => {
    let n = new Null();
    expect(n.apply()).to.deep.equal(n);
  });

  it("should succeed with simple replace", () => {
    const before = new Null().setStream(new Stream());
    const after = before.replace(new Num(5));
    expect(+before.next.version).to.deep.equal(+after);
    expect(+after).to.deep.equal(5);
  });
});

describe("Null - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Null())).to.equal("[]");
  });

  it("should deserialize", () => {
    const d = new Decoder();
    const v = d.decodeValue({ "changes.empty": [] });

    expect(v).to.be.instanceOf(Null);
  });
});
