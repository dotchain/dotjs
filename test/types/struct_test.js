// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Decoder, Replace, Atomic, PathChange } from "../../index.js";

import {
  StructDef,
  StructBase,
  Bool,
  Int,
  String,
  AnyType
} from "../../types/index.js";

let taskDef = null;
class Task extends StructBase {
  constructor(done, str, mint, any) {
    super();
    this.done = done;
    this.str = str;
    this.mutableInt = mint;
    this.any = any || null;
  }

  static structDef() {
    return taskDef;
  }
}

taskDef = new StructDef("task", Task)
  .withField("done", "Done", Bool)
  .withField("str", "String", String)
  .withField("mutableInt", "MutableInt", Int)
  .withField("any", "Any", AnyType);

Decoder.registerValueClass(Task);

describe("StructDef", () => {
  it("should ignore empty changes", () => {
    let n = new Task();
    expect(n.apply()).to.equal(n);
  });

  it("should succeed with simple replace", () => {
    const before = new Task();
    const repl = new Replace(before, new Atomic(5));
    expect(before.apply(repl)).to.equal(repl.after);
  });

  it("should succeed with replacing values", () => {
    const before = new Task(true, "s", 22, "boo");
    const replace = new Replace(new Atomic(22), new Atomic(25));
    const after = before.apply(new PathChange(["MutableInt"], replace));
    const expected = new Task(true, "s", 25, "boo");
    expect(after).to.deep.equal(expected);
  });
});

describe("Struct - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new Task(true, "s"))).to.equal('[true,"s",0,null]');
    expect(JSON.stringify(new Task(true, "s", 5, "boo"))).to.equal(
      '[true,"s",5,{"string":"boo"}]'
    );
  });

  it("should deserialize", () => {
    const d = new Decoder();

    let v = d.decodeValue({ task: [true, "s", 5, null] });
    expect(v).to.deep.equal(new Task(true, "s", 5));

    v = d.decodeValue({ task: [true, "s", 5, { string: "boo" }] });
    expect(v).to.deep.equal(new Task(true, "s", 5, "boo"));
  });
});
