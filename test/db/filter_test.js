// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Value } from "../../db/value.js";

import {
  map,
  filter,
  field,
  Null,
  Num,
  Dict,
  Text,
  Stream,
  MapIterator,
  Store,
  Bool
} from "../../db/index.js";

class LessThanTwo extends Value {
  constructor(count) {
    super();
    this.count = count;
  }

  clone() {
    return new LessThanTwo(this.count);
  }

  invoke(store, args) {
    this.count.n++;
    const val = field(
      store,
      field(store, args, new Text("it")),
      new Text("one")
    );
    return new Bool(+val < 2);
  }
}

describe("Filter dict", () => {
  it("should filter", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(0) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new LessThanTwo({ n: 0 });
    const filtered = filter(new Store(), initial, fn);
    const result = {};
    for (let [key, val] of filtered[MapIterator]()) {
      result[key] = +val.get("one");
    }
    expect(result).to.deep.equal({ hello: 1, good: 0 });
  });

  it("should keep up with map value changes", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(0) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new LessThanTwo({ n: 0 });
    const filtered = filter(new Store(), initial, fn);

    initial
      .get("hello")
      .get("one")
      .replace(new Num(100));
    initial
      .get("world")
      .get("one")
      .replace(new Num(-1));

    const result = {};
    for (let [key, val] of filtered.latest()[MapIterator]()) {
      result[key] = +val.get("one");
    }

    expect(result).to.deep.equal({ good: 0, world: -1 });
    expect(fn.count.n).to.equal(5);
  });

  it("should keep up with map additions", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(0) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new LessThanTwo({ n: 0 });
    const filtered = filter(new Store(), initial, fn);
    const future = filtered.get("boo");

    initial.get("boo").replace(new Dict({ one: new Num(-1) }));

    const result = {};
    for (let [key, val] of filtered.latest()[MapIterator]()) {
      result[key] = +val.get("one");
    }

    expect(result).to.deep.equal({ hello: 1, good: 0, boo: -1 });
    expect(future).instanceOf(Null);
    expect(+future.latest().get("one")).to.equal(-1);
    expect(fn.count.n).to.equal(4);
  });

  it("should keep up with map deletions", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(0) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new LessThanTwo({ n: 0 });
    const filtered = filter(new Store(), initial, fn);
    const hello = filtered.get("hello");

    initial.get("hello").replace(new Null());

    const result = {};
    for (let [key, val] of filtered.latest()[MapIterator]()) {
      result[key] = +val.get("one");
    }

    expect(result).to.deep.equal({ good: 0 });
    expect(hello.latest()).instanceOf(Null);
    expect(fn.count.n).to.equal(3);
  });

  it("should proxy changes on filtered values", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(0) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new LessThanTwo({ n: 0 });
    const filtered = filter(new Store(), initial, fn);
    expect(+filtered.get("hello").get("one")).to.equal(1);

    filtered
      .get("hello")
      .get("one")
      .replace(new Num(100));

    expect(
      +initial
        .latest()
        .get("hello")
        .get("one")
    ).to.equal(100);
    expect(fn.count.n).to.equal(3);
  });

  it("should work with non-dict base", () => {
    const initial = new Text("hello").setStream(new Stream());
    const fn = new LessThanTwo({ n: 0 });
    const filtered = filter(new Store(), initial, fn);

    initial.replace(
      new Dict({
        hello: new Dict({ one: new Num(1) }),
        good: new Dict({ one: new Num(0) }),
        world: new Dict({ one: new Num(2) })
      })
    );

    expect(
      +filtered
        .latest()
        .get("hello")
        .get("one")
    ).to.equal(1);
    expect(fn.count.n).to.equal(3);

    // nullify it
    initial.latest().replace(new Text("boo"));
    expect(filtered.latest()).to.be.instanceOf(Null);

    // get it back again
    initial.latest().replace(
      new Dict({
        hello: new Dict({ one: new Num(1) }),
        good: new Dict({ one: new Num(0) }),
        world: new Dict({ one: new Num(2) })
      })
    );

    expect(
      +filtered
        .latest()
        .get("hello")
        .get("one")
    ).to.equal(1);
    expect(fn.count.n).to.equal(6);
  });
});
