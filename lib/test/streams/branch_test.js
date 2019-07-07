// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Stream, Replace, Text } from "../../index.js";

import { branch } from "../../streams/branch.js";

describe("Branch", () => {
  it("should push", () => {
    const parent = new Stream();
    const child = branch(parent);
    const replace = new Replace(new Text("before"), new Text("after"));

    const c1 = child.append(replace);
    expect(parent.next).to.equal(null);
    expect(c1.push()).to.equal(c1);

    expect(parent.next.change).to.deep.equal(replace);
  });

  it("should merge push", () => {
    const parent = new Stream();
    const child = branch(parent);
    const r1 = new Replace(new Text("before"), new Text("after1"));
    const r2 = new Replace(new Text("before"), new Text("after2"));

    const c1 = child.append(r1);
    const p1 = parent.append(r2);

    expect(p1.next).to.equal(null);
    expect(c1.push()).to.equal(c1);
    expect(c1.next).to.equal(null);

    const [nextc] = r2.merge(r1);
    expect(p1.next.change).to.deep.equal(nextc);
  });

  it("should pull", () => {
    const parent = new Stream();
    const child = branch(parent);
    const replace = new Replace(new Text("before"), new Text("after"));

    const p1 = parent.append(replace);
    expect(p1.next).to.equal(null);
    expect(child.pull()).to.equal(child);

    expect(child.next.change).to.deep.equal(replace);
  });

  it("should merge pull", () => {
    const parent = new Stream();
    const child = branch(parent);
    const r1 = new Replace(new Text("before"), new Text("after1"));
    const r2 = new Replace(new Text("before"), new Text("after2"));

    const c1 = child.append(r1);
    const p1 = parent.append(r2);

    expect(p1.next).to.equal(null);
    expect(c1.next).to.equal(null);
    expect(c1.pull()).to.equal(c1);

    const nextc = r2.merge(r1)[1];
    expect(c1.next.change).to.deep.equal(nextc);
  });

  it("should undo/redo", () => {
    const child = branch(new Stream());
    expect(child.undo()).to.equal(child);
    expect(child.redo()).to.equal(child);
  });
});
