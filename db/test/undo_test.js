// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Session, Stream, Text } from "../index.js";

describe("Undo", () => {
  it("should undo/redo", () => {
    const parent = new Text("before").setStream(new Stream());
    const u = Session.undoable(parent);

    u.replace(new Text("after"));
    expect(parent.latest().text).to.equal("after");
    expect(u.latest().text).to.equal("after");

    u.undo();
    expect(parent.latest().text).to.equal("before");
    expect(u.latest().text).to.equal("before");

    u.redo();
    expect(parent.latest().text).to.equal("after");
    expect(u.latest().text).to.equal("after");
  });

  it("should not undo/redo when undo stack is empty", () => {
    const parent = new Text("before").setStream(new Stream());
    const u = Session.undoable(parent);

    u.undo();
    expect(parent.latest().text).to.equal("before");
    expect(u.latest().text).to.equal("before");

    u.redo();
    expect(parent.latest().text).to.equal("before");
    expect(u.latest().text).to.equal("before");

    u.replace(new Text("after"));
    u.redo();

    expect(parent.latest().text).to.equal("after");
    expect(u.latest().text).to.equal("after");

    u.undo();
    expect(parent.latest().text).to.equal("before");
    expect(u.latest().text).to.equal("before");

    u.undo();
    expect(parent.latest().text).to.equal("before");
    expect(u.latest().text).to.equal("before");
  });

  it("should not undo/redo upstream changes", () => {
    const parent = new Text("before").setStream(new Stream());
    const u = Session.undoable(parent);

    parent.replace(new Text("after"));

    expect(u.latest().text).to.equal("after");

    u.undo();
    expect(u.latest().text).to.equal("after");
  });

  it("should handle interleaving upstream changes", () => {
    const parent = new Text("hello").setStream(new Stream());
    const u = Session.undoable(parent);

    parent.splice(0, 0, new Text("OK, "));
    u.splice(5, 0, new Text(" world"));

    expect(u.latest().text).to.equal("OK, hello world");
    expect(parent.latest().text).to.equal("OK, hello world");

    u.undo();
    expect(u.latest().text).to.equal("OK, hello");
    expect(parent.latest().text).to.equal("OK, hello");

    parent.latest().splice(9, 0, new Text("!"));
    expect(u.latest().text).to.equal("OK, hello!");
    expect(parent.latest().text).to.equal("OK, hello!");

    u.redo();
    expect(u.latest().text).to.equal("OK, hello! world");
    expect(parent.latest().text).to.equal("OK, hello! world");
  });
});
