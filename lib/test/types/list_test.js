// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Decoder, Replace, Atomic, PathChange } from "../../index.js";

import { Task, Tasks } from "./defs.js";

describe("ListDef", () => {
  it("should ignore empty changes", () => {
    let n = new Tasks();
    expect(n.apply()).to.equal(n);
  });

  it("should succeed with simple replace", () => {
    const before = new Tasks();
    const repl = new Replace(before, new Atomic(5));
    expect(before.apply(repl)).to.equal(repl.after);
  });

  it("should succeed with replacing items", () => {
    const before = Tasks.from([new Task(true, "s", 22, "boo")]);
    const replace = new Replace(before[0], new Task(false, "s", 22, "boohoo"));
    const after = before.apply(new PathChange([0], replace));
    const expected = Tasks.from([replace.after]);
    expect(after).to.deep.equal(expected);
  });
});

describe("List - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(Tasks.from([new Task(true, "s")]))).to.equal(
      '[[true,"s",0,null]]'
    );
    expect(JSON.stringify(new Tasks())).to.equal("[]");
  });

  it("should deserialize", () => {
    const d = new Decoder();

    const v = d.decodeValue({ tasks: [[true, "s", 5, null]] });
    expect(v).to.deep.equal(Tasks.from([new Task(true, "s", 5)]));

    expect(Tasks.fromJSON(d, null)).to.deep.equal(new Tasks());
  });
});
