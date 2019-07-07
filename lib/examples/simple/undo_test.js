// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import { Stream, TextStream } from "dotjs";
import { undoable } from "dotjs/streams/undo.js";

it("undo example", () => {
  // create an undoable text stream
  let text = new TextStream("hello", undoable(new Stream()));

  // "hello" => "hello world"
  text = text.splice(5, 0, " world");
  expect(text.value).to.equal("hello world");

  // undo!
  text.stream.undo();
  text = text.latest();
  expect(text.value).to.equal("hello");

  // redo!
  text.stream.redo();
  text = text.latest();
  expect(text.value).to.equal("hello world");
});
