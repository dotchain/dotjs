// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { StringStream } from "../..";

describe("String", () => {
  it("should replace", () => {
    const s0 = new StringStream("hello");
    const s1 = s0.replace("world");
    expect(s1.value).to.equal("world");
    expect(s0.value).to.equal("hello");
  });

  it("should converge", () => {
    const s0 = new StringStream("hello");
    const s1 = s0.replace("world");
    expect(s1.value).to.equal("world");
    expect(s0.value).to.equal("hello");
    expect(s0.next.value).to.equal("world");

    expect(s1.next).to.equal(null);
    expect(s0.next.next).to.equal(null);
  });

  it("should converge with multiple edits", () => {
    const s0 = new StringStream("hello");
    const s1 = s0.replace("world");
    const s2 = s0.replace("froyo");
    const s3 = s1.replace("fever");
    const s4 = s2.replace("hoity");

    for (let s of [s0, s1, s2, s3, s4]) {
      expect(s.latest().value).to.equal("hoity");
    }
  });
});