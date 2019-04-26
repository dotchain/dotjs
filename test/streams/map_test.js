// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { StringStream, MapStream, Map, Atomic } from "../../index.js";

describe("MapStream", () => {
  const zero = new Atomic("world");
  const one = new Atomic("world1");
  const two = new Atomic("world2");
  const three = new Atomic("world3");
  const four = new Atomic("world4");

  it("should replace", () => {
    const m0 = new MapStream([[0, one]]);
    const m1 = m0.replace(new Map([[1, two]]));
    expect(m1.value).to.deep.equal(new Map([[1, two]]));
    expect(m0.value).to.deep.equal(new Map([[0, one]]));
  });

  it("should set", () => {
    const m0 = new MapStream([[0, zero]]);
    const m1 = m0.set(0, one);

    expect(m0.value).to.deep.equal(new Map([[0, zero]]));
    expect(m1.value).to.deep.equal(new Map([[0, one]]));

    expect(m0.latest().value).to.deep.equal(new Map([[0, one]]));
  });

  it("should converge", () => {
    const m0 = new MapStream([[0, zero]]);
    const m1 = m0.replace(new Map([[1, one]]));
    expect(m1.value).to.deep.equal(new Map([[1, one]]));
    expect(m0.value).to.deep.equal(new Map([[0, zero]]));
    expect(m0.next.value).to.deep.equal(new Map([[1, one]]));

    expect(m1.next).to.equal(null);
    expect(m0.next.next).to.equal(null);
  });

  it("should converge with multiple edits", () => {
    const m0 = new MapStream([[0, zero]]);
    const m1 = m0.replace(new Map([[1, one]]));
    const m2 = m0.replace(new Map([[2, two]]));
    const m3 = m1.replace(new Map([[3, three]]));
    const m4 = m2.replace(new Map([[4, four]]));
    for (let m of [m0, m1, m2, m3, m4]) {
      expect(m.latest().value).to.deep.equal(new Map([[4, four]]));
    }
  });

  it("should converge with multiple edits", () => {
    const m0 = new MapStream([[0, zero]]);
    const m1 = m0.set(0, one);
    const m2 = m0.set(0, null);
    const m3 = m1.set(1, four);
    const m4 = m2.set(1, three);

    for (let m of [m0, m1, m2, m3, m4]) {
      expect(m.latest().value).to.deep.equal(new Map([[1, three]]));
    }
  });
});

describe("MapStream.substream", () => {
  it("should track sub-stream changes", () => {
    const m0 = new MapStream([["boo", new Atomic("hoo")]]);

    const child0 = m0.substream("boo", StringStream);
    child0.replace("wonderboo");

    expect(m0.latest().value).to.deep.equal(
      new Map([["boo", new Atomic("wonderboo")]])
    );
  });
});
