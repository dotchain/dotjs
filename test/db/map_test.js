// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Value } from "../../db/value.js";

import {
  map,
  field,
  Null,
  Num,
  Dict,
  Text,
  Stream,
  MapIterator,
  Store
} from "../../db/index.js";

class F extends Value {
  constructor(key, count) {
    super();
    this.key = key;
    this.count = count;
  }

  clone() {
    return new F(this.key, this.count);
  }

  invoke(store, args) {
    this.count.n++;
    return field(store, field(store, args, new Text("it")), new Text(this.key));
  }
}

describe("Map dict", () => {
  it("should map", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const mapped = map(new Store(), initial, new F("one", { n: 0 }));
    const result = {};
    for (let [key, val] of mapped[MapIterator]()) {
      result[key] = +val;
    }
    expect(result).to.deep.equal({ hello: 1, world: 2 });
  });

  it("should keep up with map value changes", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new F("one", { n: 0 });
    const mapped = map(new Store(), initial, fn);

    initial
      .get("hello")
      .get("one")
      .replace(new Num(100));

    const result = {};
    for (let [key, val] of mapped.latest()[MapIterator]()) {
      result[key] = +val;
    }
    expect(result).to.deep.equal({ hello: 100, world: 2 });
    expect(fn.count.n).to.equal(4);
  });

  it("should keep up with map additions", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new F("one", { n: 0 });
    const mapped = map(new Store(), initial, fn);
    const future = mapped.get("boo");

    initial.get("boo").replace(new Dict({ one: new Num(10) }));

    const result = {};
    for (let [key, val] of mapped.latest()[MapIterator]()) {
      result[key] = +val;
    }

    expect(result).to.deep.equal({ hello: 1, world: 2, boo: 10 });
    expect(future).instanceOf(Null);
    expect(+future.latest()).to.equal(10);
    expect(fn.count.n).to.equal(5);
  });

  it("should keep up with map deletions", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new F("one", { n: 0 });
    const mapped = map(new Store(), initial, fn);
    const hello = mapped.get("hello");

    initial.get("hello").replace(new Null());

    const result = {};
    for (let [key, val] of mapped.latest()[MapIterator]()) {
      result[key] = +val;
    }

    expect(result).to.deep.equal({ world: 2 });
    expect(hello.latest()).instanceOf(Null);
    expect(fn.count.n).to.equal(4);
  });

  it("should proxy changes on mapped values", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new F("one", { n: 0 });
    const mapped = map(new Store(), initial, fn);
    expect(+mapped.get("hello")).to.equal(1);

    mapped.get("hello").replace(new Num(100));

    expect(
      +initial
        .latest()
        .get("hello")
        .get("one")
    ).to.equal(100);
    expect(fn.count.n).to.equal(2);
  });

  it("should work with non-dict base", () => {
    const initial = new Text("hello").setStream(new Stream());
    const fn = new F("one", { n: 0 });
    const mapped = map(new Store(), initial, fn);

    initial.replace(
      new Dict({
        hello: new Dict({ one: new Num(1) }),
        world: new Dict({ one: new Num(2) })
      })
    );

    expect(+mapped.latest().get("hello")).to.equal(1);
    expect(fn.count.n).to.equal(2);

    // nullify it
    initial.latest().replace(new Text("boo"));
    expect(mapped.latest()).to.be.instanceOf(Null);

    // get it back again
    initial.latest().replace(
      new Dict({
        hello: new Dict({ one: new Num(1) }),
        world: new Dict({ one: new Num(2) })
      })
    );

    expect(+mapped.latest().get("hello")).to.equal(1);
    expect(fn.count.n).to.equal(4);
  });
});
