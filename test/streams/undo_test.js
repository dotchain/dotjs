// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Stream, Replace, Splice, Text } from "../../index.js";
import { branch } from "../../streams/branch.js";
import { undoable } from "../../streams/undo.js";

describe("Undo", () => {
  it("should undo/redo", () => {
    let parent = new Stream();
    const u = undoable(parent);

    const c = new Replace(new Text("before"), new Text("after"));
    const u1 = u.append(c);

    expect(parent.next.change).to.deep.equal(c);
    parent = parent.next.version;
    u1.undo();
    expect(u1.next.change).to.deep.equal(c.revert());
    const u2 = u1.next.version;
    u2.redo();
    expect(u2.next.change).to.deep.equal(c);
    parent = parent.next.version;
    expect(parent.next.change).to.deep.equal(c);
  });

  it("should not undo/redo when undo stack is empty", () => {
    let parent = new Stream();
    let u = undoable(parent);

    expect(u.undo()).to.equal(u);
    expect(u.redo()).to.equal(u);
    expect(parent.next).to.equal(null);

    u = u.append(new Replace(new Text("before"), new Text("after")));
    parent = parent.next.version;

    expect(u.redo()).to.equal(u);
    expect(parent.next).to.equal(null);

    u.undo();
    u = u.next.version;
    parent = parent.next.version;
    u.undo();
    expect(parent.next).to.equal(null);
  });

  it("should not undo/redo upstream changes", () => {
    let parent = new Stream();
    let u = undoable(branch(parent));
    const c = new Replace(new Text("before"), new Text("after"));

    parent = parent.append(c);
    u.pull();
    expect(u.next.change).to.deep.equal(c);
    u = u.next.version;

    u.undo();
    expect(u.next).to.equal(null);
  });

  it("should handle interleaving upstream changes", () => {
    let parent = new Stream();
    let u = undoable(branch(parent));
    const up = new Splice(0, new Text("hello"), new Text("hello world"));
    const down = new Splice(100, new Text("boo"), new Text("boo hoo"));

    u = u.append(down);
    parent = parent.append(up);
    u.pull();
    u = u.next.version;
    u.undo();

    const diff = up.after.length - up.before.length;
    const expected = new Splice(100 + diff, down.after, down.before);
    expect(u.next.change).to.deep.equal(expected);
    u = u.next.version;

    // now do the same thing with redo
    parent.append(new Splice(50, up.before, up.after));
    u.pull();
    u = u.next.version;
    u.redo();

    const expected2 = new Splice(100 + diff + diff, down.before, down.after);
    expect(u.next.change).to.deep.equal(expected2);
  });
});
