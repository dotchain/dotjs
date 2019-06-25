// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import { Dict, Text, Stream } from "../../db/index.js";

describe("Dict", () => {
  it("should converge", () => {
    const d = new Dict({ hello: new Text("world") });
    d.stream = new Stream();

    const hello = d.get("hello");
    const h2 = hello.splice(5, 0, "!");

    expect(h2.text).to.equal("world!");
    expect(hello.next.version.text).to.equal("world!");
    expect(d.next.version.get("hello").text).to.equal("world!");
  });

  it("should converge with defaults", () => {
    // missing keys are all assumed to contain {w: "world"}
    const d = new Dict({}, () => new Dict({ w: new Text("world") }));
    d.stream = new Stream();

    const h1 = d.get("hello");
    const h2 = d.get("hello");

    const h1x = h1.get("w").splice(5, 0, "!");
    expect(h1x.text).to.equal("world!");

    const d2 = d.next.version;
    expect(d2.get("hello").get("w").text).to.equal("world!");

    const h2x = h2.next.version.get("w");
    expect(h2x.text).to.equal("world!");
  });
});
