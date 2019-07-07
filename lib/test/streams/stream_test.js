// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Stream, Replace, Text } from "../../index.js";

describe("Stream", () => {
  it("should append", () => {
    const s0 = new Stream();
    const c = new Replace(new Text("before"), new Text("after"));
    const s1 = s0.append(c);

    expect(s0.next.change).to.deep.equal(c);
    expect(s0.next.version).to.equal(s1);
    expect(s1.next).to.equal(null);
  });

  it("should merge append", () => {
    const s0 = new Stream();
    const c1 = new Replace(new Text("before"), new Text("after1"));
    const c2 = new Replace(new Text("before"), new Text("after2"));

    const s1 = s0.append(c1);
    const s2 = s0.append(c2);

    const [c1x, c2x] = c1.merge(c2);

    expect(s0.next.change).to.deep.equal(c1);
    const s0next = s0.next.version;
    expect(s0next.next.change).to.deep.equal(c1x);
    expect(s1.next.change).to.deep.equal(c1x);

    expect(s2.next.change).to.deep.equal(c2x);
  });

  it("should reverse merge reverse append", () => {
    const s0 = new Stream();
    const c1 = new Replace(new Text("before"), new Text("after1"));
    const c2 = new Replace(new Text("before"), new Text("after2"));

    const s1 = s0.append(c1);
    const s2 = s0.reverseAppend(c2);

    const [c2x, c1x] = c2.merge(c1);

    expect(s0.next.change).to.deep.equal(c1);
    const s0next = s0.next.version;
    expect(s0next.next.change).to.deep.equal(c1x);
    expect(s1.next.change).to.deep.equal(c1x);

    expect(s2.next.change).to.deep.equal(c2x);
  });

  it("should implement push, pull, undo and redo", () => {
    const s = new Stream();
    expect(s.push()).to.equal(s);
    expect(s.pull()).to.equal(s);
    expect(s.undo()).to.equal(s);
    expect(s.redo()).to.equal(s);
  });
});
