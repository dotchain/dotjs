// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Encoder } from "../encode.js";
import { Decoder } from "../decode.js";
import { Replace } from "../replace.js";
import { Num } from "../index.js";

describe("Codec", () => {
  const d = new Decoder();

  const encode = v => JSON.parse(JSON.stringify(Encoder.encode(v)));

  it("should not encode strange values", () => {
    try {
      d.decode({});
    } catch (e) {
      return;
    }
    expect(false);
  });

  it("should not decode invalid objects", () => {
    const v = { boo: 23 };
    expect(d.decode(v)).to.equal();
  });

  it("should decode empty as null", () => {
    expect(d.decode(null)).to.equal(null);
    expect(d.decode()).to.equal(null);
  });

  it("should decode basic encoded values", () => {
    const values = [true, 5, 5.3, new Date(), "hello"];
    for (let v of values) {
      expect(JSON.stringify(d.decode(encode(v)))).to.equal(JSON.stringify(v));
    }
  });

  it("should decode value types", () => {
    const v = new Num(5);
    expect(d.decode(encode(v))).to.deep.equal(v);
  });

  it("should decode change types", () => {
    const v = new Replace(new Num(5), new Num(2));
    expect(d.decode(encode(v))).to.deep.equal(v);
  });
});
