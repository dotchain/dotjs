// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import { TextStream } from "dotjs";

it("string example", () => {
  // create  a new text stream
  const s = new TextStream("hello");

  // "hello" => " world!"
  let s1 = s.splice(s.value.length, 0, " world!");

  // in parallel, "hello" => "Hello"
  let s2 = s.splice(0, 1, "H");

  // converge!
  s1 = s1.latest();
  s2 = s2.latest();

  expect(s1.value).to.equal("Hello world!");
  expect(s2.value).to.equal("Hello world!");
});
