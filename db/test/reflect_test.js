// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Dict, Ref, Store, Stream, Text, View, run, field } from "../index.js";
import { Reflect } from "../reflect.js";

describe("Reflect", () => {
  it("should reflect field", () => {
    const store = new Store({
      hello: new Dict({
        world: new Text("boo")
      })
    }).setStream(new Stream());

    const f = field(store, new Ref(["hello"]), new Text("world"));
    const def = Reflect.definition(f);
    const expected = new View(
      new Dict({
        viewFn: new Reflect.FieldFn(),
        obj: new Ref(["hello"]),
        key: new Text("world")
      })
    );
    expect(JSON.stringify(def)).to.deep.equal(JSON.stringify(expected));
    expect(run(store, def).text).to.equal("boo");
  });
});
