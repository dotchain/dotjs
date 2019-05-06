// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import { Stream, TextStream } from "dotjs";
import { branch } from "dotjs/streams/branch.js";

it("branch example", () => {
  // create a parent raw stream + branch
  const parent = new Stream();
  const child = branch(parent);

  // create text streams out of both
  let sParent = new TextStream("hello", parent);
  let sChild = new TextStream("hello", child);

  // modify child: "hello" => " world!"
  sChild = sChild.splice(sChild.value.length, 0, " world!");

  // expect parent to not have changed
  expect(sParent.latest()).to.equal(sParent);

  // modify parent: "hello" => "Hello"
  sParent = sParent.splice(0, 1, "H");

  // expect child to not have changed
  expect(sChild.latest()).to.equal(sChild);

  // now pull parent into child
  sChild.stream.pull();
  sChild = sChild.latest();
  expect(sChild.value).to.equal("Hello world!");
  expect(sParent.latest()).to.equal(sParent.latest());

  // now push child to parent
  sChild.stream.push();
  sParent = sParent.latest();
  expect(sParent.value).to.equal("Hello world!");
});
