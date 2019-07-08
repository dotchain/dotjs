// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Stream, Text } from "../index.js";

describe("branch", () => {
  it("should push", () => {
    const parent = new Text("before").setStream(new Stream());
    const child = parent.branch();
    const c1 = child.replace(new Text("after"));

    expect(parent.next).to.equal(null);

    expect(c1.push()).to.equal(null);
    expect(parent.next.version.text).to.deep.equal(c1.text);
  });

  it("should pull", () => {
    const parent = new Text("before").setStream(new Stream());
    const child = parent.branch();

    const p1 = parent.replace(new Text("after"));
    expect(p1.next).to.equal(null);
    expect(child.pull()).to.equal(null);

    expect(child.next.version.text).to.equal(p1.text);
  });

  it("should merge", () => {
    const parent = new Text("before").setStream(new Stream());
    const child = parent.branch();

    const c1 = child.replace(new Text("after1"));
    const p1 = parent.replace(new Text("after2"));

    expect(p1.next).to.equal(null);
    expect(c1.push()).to.equal(null);
    expect(c1.next).to.equal(null);

    expect(c1.pull()).to.equal(null);
    expect(p1.latest().text).to.equal(c1.latest().text);
  });

  it("should undo/redo", () => {
    const parent = new Text("before").setStream(new Stream());
    const child = parent.branch();
    expect(child.undo()).to.equal(null);
    expect(child.redo()).to.equal(null);
  });
});
