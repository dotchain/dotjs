// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  Substream,
  PathChange,
  Splice,
  Move,
  List,
  Stream,
  Replace,
  Text
} from "../../index.js";

describe("Substream", () => {
  const path = ["boo", 3, "hoo"];

  it("should append -- child", () => {
    const parent = new Stream();
    const s0 = new Substream(parent, path);
    const c = new Replace(new Text("before"), new Text("after"));
    const s1 = s0.append(c);

    expect(s0.next.change).to.deep.equal(c);
    expect(parent.next.change).to.deep.equal(new PathChange(path, c));
    expect(s1.next).to.equal(null);
  });

  it("should append -- parent matching path", () => {
    const parent = new Stream();
    const s0 = new Substream(parent, path);
    const c = new Replace(new Text("before"), new Text("after"));
    parent.append(new PathChange(path, c));

    expect(s0.next.change).to.deep.equal(c);
  });

  it("should append -- parent sub path", () => {
    const parent = new Stream();
    const s0 = new Substream(parent, path);
    const c = new Replace(new Text("before"), new Text("after"));
    parent.append(new PathChange(path.concat(["inner"]), c));

    expect(s0.next.change).to.deep.equal(new PathChange(["inner"], c));
  });

  it("should append -- parent super path", () => {
    let parent = new Stream();
    const s0 = new Substream(parent, path);
    const c = new Replace(new Text("before"), new Text("after"));
    parent = parent.append(new PathChange(path.slice(0, 1), c));
    parent.append(new PathChange(path, c));

    expect(s0.next).to.equal(null);
  });

  it("should append -- parent alt path", () => {
    const parent = new Stream();
    const s0 = new Substream(parent, path);
    const c = new Replace(new Text("before"), new Text("after"));
    parent.append(new PathChange(["alt"], c));

    expect(s0.next.change).to.deep.equal(null);
  });

  it("should append -- parent splice", () => {
    let parent = new Stream();
    let s0 = new Substream(parent, path);
    const c = new Splice(
      0,
      new List(),
      new List(new Text("ok"), new Text("computer"))
    );
    parent = parent.append(new PathChange(path.slice(0, 1), c));

    const replace = new Replace(new Text("before"), new Text("after"));
    s0.next.version.append(replace);
    expect(parent.next.change).to.deep.equal(
      new PathChange(["boo", 5, "hoo"], replace)
    );
  });

  it("should append -- parent splice #2", () => {
    let parent = new Stream();
    let s0 = new Substream(parent, path);
    const c = new Splice(
      0,
      new List(),
      new List(new Text("ok"), new Text("computer"))
    );
    parent = parent.append(new PathChange(path.slice(0, 1), c));
    const s1 = s0.next.version;

    const replace = new Replace(new Text("before"), new Text("after"));
    parent = parent.append(new PathChange(["boo", 5, "hoo"], replace));

    expect(s1.next.change).to.deep.equal(replace);
  });

  it("should append -- parent move", () => {
    let parent = new Stream();
    let s0 = new Substream(parent, path);
    const c = new Move(100, 2, -99);
    parent = parent.append(new PathChange(path.slice(0, 1), c));

    const replace = new Replace(new Text("before"), new Text("after"));
    s0.next.version.append(replace);
    expect(parent.next.change).to.deep.equal(
      new PathChange(["boo", 5, "hoo"], replace)
    );
  });

  it("should implement push, pull, undo and redo", () => {
    const parent = new Stream();
    const s = new Substream(parent, path);
    expect(s.push()).to.equal(s);
    expect(s.pull()).to.equal(s);
    expect(s.undo()).to.equal(s);
    expect(s.redo()).to.equal(s);
  });
});
