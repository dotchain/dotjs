// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Value } from "../value.js";

import { field, group, Num, Dict, Text, Stream, Store } from "../index.js";

class One extends Value {
  constructor(count) {
    super();
    this.count = count;
  }

  clone() {
    return new One(this.count);
  }

  invoke(store, args) {
    this.count.n++;
    return field(store, field(store, args, new Text("it")), new Text("one"));
  }
}

describe.skip("Benchmark", () => {
  it("group", () => {
    const m = {};
    for (let kk = 0; kk < 10000; kk++) {
      m[kk] = new Dict({ one: new Num(kk % 2) });
    }

    for (let kk = 0; kk < 10; kk++) {
      const initial = new Dict(m).setStream(new Stream());
      const fn = new One({ n: 0 });
      const grouped = group(new Store(), initial, fn);
      initial
        .get("5")
        .get("one")
        .replace(new Num(5));
      initial
        .get("6")
        .get("one")
        .replace(new Num(5));
      grouped.latest();
    }
  }).timeout(10000);
});
