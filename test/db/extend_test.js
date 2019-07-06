// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  extend,
  Null,
  Dict,
  Text,
  Stream,
  MapIterator,
  Store
} from "../../db/index.js";

describe("extend", () => {
  it("should extend", () => {
    const left = new Dict({
      hello: new Text("hello"),
      world: new Text("world")
    });
    const right = new Dict({
      hello: new Text("hello2"),
      boo: new Text("hoo")
    });
    const extended = extend(new Store(), left, right);

    const result = {};
    for (let [key, val] of extended[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello2",
      world: "world",
      boo: "hoo"
    });
  });

  it("should keep up with changes", () => {
    const left = new Dict({
      hello: new Text("hello"),
      world: new Text("world")
    }).setStream(new Stream());
    const right = new Dict({
      hello: new Text("hello2"),
      boo: new Text("hoo")
    }).setStream(new Stream());
    const extended = extend(new Store(), left, right);

    left.get("left").replace(new Text("left"));
    left.get("left2").replace(new Text("left2"));
    left.get("hello").replace(new Text("hell"));
    left.get("world").replace(new Text("world-left"));
    right.get("right").replace(new Text("right"));
    right.get("boo").replace(new Text("hoo2"));
    right.get("hello").replace(new Null());
    right.get("left2").replace(new Text("right2"));

    const result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      left: "left",
      hello: "hell",
      world: "world-left",
      right: "right",
      boo: "hoo2",
      left2: "right2"
    });
  });

  it("should proxy changes to right", () => {
    const left = new Dict({
      hello: new Text("hello"),
      world: new Text("world")
    }).setStream(new Stream());
    const right = new Dict({
      hello: new Text("hello2"),
      boo: new Text("hoo")
    }).setStream(new Stream());
    const extended = extend(new Store(), left, right);
    extended.get("new").replace(new Text("new3"));
    extended.get("boo").replace(new Text("boo3"));
    extended.get("hello").replace(new Text("hello3"));

    const result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello3",
      world: "world",
      boo: "boo3",
      new: "new3"
    });
    expect(left.next).to.equal(null);
  });

  it("should proxy changes to left", () => {
    const left = new Dict({
      hello: new Text("hello"),
      boo: new Text("boo"),
      world: new Text("world")
    }).setStream(new Stream());
    const right = new Dict({
      hello: new Text("hello2"),
      hoo: new Text("hoo")
    }).setStream(new Stream());
    const extended = extend(new Store(), left, right);

    extended.get("world").replace(new Text("world3"));
    extended.get("boo").replace(new Null());

    const result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello2",
      world: "world3",
      hoo: "hoo"
    });
    expect(right.next).to.equal(null);
  });

  it("should proxy deletions of common keys", () => {
    const left = new Dict({
      hello: new Text("hello"),
      boo: new Text("boo"),
      world: new Text("world")
    }).setStream(new Stream());
    const right = new Dict({
      hello: new Text("hello2"),
      hoo: new Text("hoo"),
      world: new Text("world")
    }).setStream(new Stream());
    const extended = extend(new Store(), left, right);

    extended.get("world").replace(new Null());
    extended.get("hello").replace(new Null());
    extended
      .latest()
      .get("hello")
      .replace(new Text("oops"));

    const result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "oops",
      boo: "boo",
      hoo: "hoo"
    });
    expect(
      left
        .latest()
        .get("world")
        .clone()
    ).to.deep.equal(new Null());
    expect(
      left
        .latest()
        .get("hello")
        .clone()
    ).to.deep.equal(new Null());
    expect(
      right
        .latest()
        .get("world")
        .clone()
    ).to.deep.equal(new Null());
    expect(right.latest().get("hello").text).to.deep.equal("oops");
  });

  it("should work with non-dict left", () => {
    const left = new Text("boo").setStream(new Stream());
    const right = new Dict({
      hello: new Text("hello2"),
      hoo: new Text("hoo"),
      world: new Text("world")
    }).setStream(new Stream());
    const extended = extend(new Store(), left, right);

    let result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello2",
      hoo: "hoo",
      world: "world"
    });

    left.replace(
      new Dict({
        hello: new Text("hello"),
        boo: new Text("boo")
      })
    );

    result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello2",
      hoo: "hoo",
      boo: "boo",
      world: "world"
    });

    left.replace(new Text("coo"));

    result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello2",
      hoo: "hoo",
      world: "world"
    });
  });

  it("should work with non-dict right", () => {
    const left = new Dict({
      hello: new Text("hello"),
      boo: new Text("boo")
    }).setStream(new Stream());
    const right = new Text("boo").setStream(new Stream());
    const extended = extend(new Store(), left, right);

    let result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello",
      boo: "boo"
    });

    right.replace(
      new Dict({
        hello: new Text("hello2"),
        hoo: new Text("hoo"),
        world: new Text("world")
      })
    );

    result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello2",
      hoo: "hoo",
      boo: "boo",
      world: "world"
    });

    right.replace(new Text("coo"));

    result = {};
    for (let [key, val] of extended.latest()[MapIterator]()) {
      result[key] = val.text;
    }

    expect(result).to.deep.equal({
      hello: "hello",
      boo: "boo"
    });
  });
});
