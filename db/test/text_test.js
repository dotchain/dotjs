// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Text, Stream } from "../index.js";

describe("Text", () => {
  it("should replace", () => {
    const s0 = new Text("hello").setStream(new Stream());
    const s1 = s0.replace(new Text("world"));
    expect(s1.text).to.equal("world");
    expect(s0.text).to.equal("hello");
  });

  it("should splice", () => {
    const s0 = new Text("hello").setStream(new Stream());
    const s1 = s0.splice(2, 2, new Text("y"));
    expect(s1.text).to.equal("heyo");
    expect(s0.text).to.equal("hello");
    expect(s0.latest().text).to.equal("heyo");
  });

  it("should move", () => {
    const s0 = new Text("ridelow").setStream(new Stream());
    const s1 = s0.move(4, 3, -4);
    expect(s1.text).to.equal("lowride");
    expect(s0.text).to.equal("ridelow");
    expect(s0.latest().text).to.equal("lowride");
  });

  it("should converge", () => {
    const s0 = new Text("hello").setStream(new Stream());
    const s1 = s0.replace(new Text("world"));
    expect(s1.text).to.equal("world");
    expect(s0.text).to.equal("hello");
    expect(s0.next.version.text).to.equal("world");

    expect(s1.next).to.equal(null);
    expect(s0.next.version.next).to.equal(null);
  });

  it("should converge with multiple edits", () => {
    const s0 = new Text("hello").setStream(new Stream());
    const s1 = s0.replace(new Text("world"));
    const s2 = s0.replace(new Text("froyo"));
    const s3 = s1.replace(new Text("fever"));
    const s4 = s2.replace(new Text("hoity"));

    for (let s of [s0, s1, s2, s3, s4]) {
      expect(s.latest().text).to.equal("hoity");
    }
  });
});
