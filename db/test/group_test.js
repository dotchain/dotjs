// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Value } from "../value.js";

import {
  field,
  group,
  Null,
  Num,
  Dict,
  Text,
  Stream,
  MapIterator,
  Store
} from "../index.js";

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

describe("group", () => {
  it("should group", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new One({ n: 0 });
    const grouped = group(new Store(), initial, fn);

    const result = {};
    for (let [group, v] of grouped[MapIterator]()) {
      result[group] = {};
      for (let [key, val] of v[MapIterator]()) {
        result[group][key] = +val.get("one");
      }
    }

    expect(result).to.deep.equal({
      '{"dotdb.Num":1}': { hello: 1, good: 1 },
      '{"dotdb.Num":2}': { world: 2 }
    });

    expect(fn.count.n).to.equal(3);
  });

  it("should keep up with map value changes", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new One({ n: 0 });
    const grouped = group(new Store(), initial, fn);

    initial
      .get("hello")
      .get("one")
      .replace(new Num(3));
    initial
      .get("world")
      .get("one")
      .replace(new Num(3));

    const result = {};
    for (let [group, v] of grouped.latest()[MapIterator]()) {
      result[group] = {};
      for (let [key, val] of v[MapIterator]()) {
        result[group][key] = +val.get("one");
      }
    }

    expect(result).to.deep.equal({
      '{"dotdb.Num":1}': { good: 1 },
      '{"dotdb.Num":3}': { hello: 3, world: 3 }
    });
    expect(fn.count.n).to.equal(5);
  });

  it("should keep up with map additions", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new One({ n: 0 });
    const grouped = group(new Store(), initial, fn);
    const futureBoo = grouped.get('{"dotdb.Num":1}').get("boo");
    const futureHoo = grouped.get('{"dotdb.Num":3}').get("hoo");

    initial.get("boo").replace(new Dict({ one: new Num(1) }));
    initial.get("hoo").replace(new Dict({ one: new Num(3) }));

    const result = {};
    for (let [group, v] of grouped.latest()[MapIterator]()) {
      result[group] = {};
      for (let [key, val] of v[MapIterator]()) {
        result[group][key] = +val.get("one");
      }
    }

    expect(result).to.deep.equal({
      '{"dotdb.Num":1}': { hello: 1, good: 1, boo: 1 },
      '{"dotdb.Num":2}': { world: 2 },
      '{"dotdb.Num":3}': { hoo: 3 }
    });
    expect(fn.count.n).to.equal(5);
    expect(futureBoo).instanceOf(Null);
    expect(futureHoo).instanceOf(Null);
    expect(+futureBoo.latest().get("one")).to.equal(1);
    expect(+futureHoo.latest().get("one")).to.equal(3);
  });

  it("should keep up with map deletions", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new One({ n: 0 });
    const grouped = group(new Store(), initial, fn);
    const hello = grouped.get('{"dotdb.Num":2}');

    initial.get("hello").replace(new Null());
    initial.get("world").replace(new Null());

    const result = {};
    for (let [group, v] of grouped.latest()[MapIterator]()) {
      result[group] = {};
      for (let [key, val] of v[MapIterator]()) {
        result[group][key] = +val.get("one");
      }
    }

    expect(result).to.deep.equal({
      '{"dotdb.Num":1}': { good: 1 }
    });
    expect(hello.latest()).instanceOf(Null);
    expect(fn.count.n).to.equal(4);
  });

  it("should proxy changes on filtered values", () => {
    const initial = new Dict({
      hello: new Dict({ one: new Num(1) }),
      good: new Dict({ one: new Num(1) }),
      world: new Dict({ one: new Num(2) })
    }).setStream(new Stream());
    const fn = new One({ n: 0 });
    const grouped = group(new Store(), initial, fn);

    // replace hello with num = 3
    grouped
      .get('{"dotdb.Num":1}')
      .get("hello")
      .get("one")
      .replace(new Num(3));

    // delete the whole "2" group
    grouped.get('{"dotdb.Num":2}').replace(new Null());

    // add a 4 group
    grouped
      .get('{"dotdb.Num":4}')
      .get("boo")
      .replace(new Dict({ one: new Num(4) }));

    const result1 = {};
    for (let [key, val] of initial.latest()[MapIterator]()) {
      result1[key] = +val.get("one");
    }
    expect(result1).to.deep.equal({ hello: 3, good: 1, boo: 4 });

    const result = {};
    for (let [group, v] of grouped.latest()[MapIterator]()) {
      result[group] = {};
      for (let [key, val] of v[MapIterator]()) {
        result[group][key] = +val.get("one");
      }
    }

    expect(result).to.deep.equal({
      '{"dotdb.Num":1}': { good: 1 },
      '{"dotdb.Num":3}': { hello: 3 },
      '{"dotdb.Num":4}': { boo: 4 }
    });

    expect(fn.count.n).to.equal(6);
  });

  it("should work with non-dict base", () => {
    const initial = new Text("hello").setStream(new Stream());
    const fn = new One({ n: 0 });
    const grouped = group(new Store(), initial, fn);

    initial.replace(
      new Dict({
        hello: new Dict({ one: new Num(1) }),
        good: new Dict({ one: new Num(1) }),
        world: new Dict({ one: new Num(2) })
      })
    );

    const result = {};
    for (let [group, v] of grouped.latest()[MapIterator]()) {
      result[group] = {};
      for (let [key, val] of v[MapIterator]()) {
        result[group][key] = +val.get("one");
      }
    }

    expect(result).to.deep.equal({
      '{"dotdb.Num":1}': { hello: 1, good: 1 },
      '{"dotdb.Num":2}': { world: 2 }
    });

    expect(fn.count.n).to.equal(3);

    // nullify it
    initial.latest().replace(new Text("boo"));
    expect(grouped.latest()).to.be.instanceOf(Null);

    // get it back again
    initial.replace(
      new Dict({
        hello: new Dict({ one: new Num(1) }),
        good: new Dict({ one: new Num(1) }),
        world: new Dict({ one: new Num(2) })
      })
    );

    const result2 = {};
    for (let [group, v] of grouped.latest()[MapIterator]()) {
      result2[group] = {};
      for (let [key, val] of v[MapIterator]()) {
        result2[group][key] = +val.get("one");
      }
    }

    expect(result2).to.deep.equal({
      '{"dotdb.Num":1}': { hello: 1, good: 1 },
      '{"dotdb.Num":2}': { world: 2 }
    });

    expect(fn.count.n).to.equal(6);
  });
});
