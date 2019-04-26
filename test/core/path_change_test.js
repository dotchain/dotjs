// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Null, Atomic, Map, PathChange, Replace } from "../../index.js";
import { FakeDecoder } from "./decoder_test.js";

describe("PathChange", () => {
  it("reverts", () => {
    const path = [1, "hello"];
    expect(new PathChange(path).revert()).to.equal(null);

    const replace = new Replace(new Null(), new Atomic(new Null()));
    const expected = new Replace(replace.after, replace.before);
    expect(new PathChange(path, replace).revert()).to.deep.equal(
      new PathChange(path, expected)
    );
  });

  it("merges with null", () => {
    const c = new PathChange();
    expect(c.merge(null)).to.deep.equal([null, c]);
  });

  it("merges with no paths", () => {
    const before = new Atomic("before");
    const after1 = new Atomic("after1");
    const after2 = new Atomic("after2");

    const c1 = new PathChange(null, new Replace(before, after1));
    const c2 = new PathChange(null, new Replace(before, after2));
    expect(c1.merge(c2)).to.deep.equal(c1.change.merge(c2.change));
  });

  it("merges with same paths", () => {
    const before = new Atomic("before");
    const after1 = new Atomic("after1");
    const after2 = new Atomic("after2");

    const p = [1, "hello"];
    const c1 = new PathChange(p, new Replace(before, after1));
    const c2 = new PathChange(p, new Replace(before, after2));
    const [left, right] = c1.change.merge(c2.change);
    const expected = [PathChange.create(p, left), PathChange.create(p, right)];
    expect(c1.merge(c2)).to.deep.equal(expected);
  });

  it("merges with replace", () => {
    const before = new Atomic("before");
    const after1 = new Atomic("after1");
    const after2 = new Atomic("after2");

    const c1 = new PathChange(null, new Replace(before, after1));
    const c2 = new Replace(before, after2);
    const expected = c1.change.merge(c2);
    expect(c1.merge(c2)).to.deep.equal(expected);
  });

  it("reverse merges with replace", () => {
    const before = new Atomic("before");
    const after1 = new Atomic("after1");
    const after2 = new Atomic("after2");

    const c1 = new PathChange(null, new Replace(before, after1));
    const c2 = new Replace(before, after2);
    const [left, right] = c2.merge(c1.change);
    const expected = [right, left];
    expect(c1.reverseMerge(c2)).to.deep.equal(expected);
  });

  it("merges with different paths", () => {
    const replace = new Replace(new Atomic("before"), new Atomic("after"));
    const c1 = new PathChange(["one"], replace);
    const c2 = new PathChange(["deux"], replace);
    const merged = c1.merge(c2);
    expect(merged[0]).to.equal(c2);
    expect(merged[1]).to.equal(c1);
  });

  it("merges with sub path", () => {
    const inner = new Map().set("hello", new Atomic("world"));
    const prefix = ["some", 1];

    const world2bozo = new Replace(new Atomic("world"), new Atomic("bozo"));
    const c1 = new PathChange(prefix.concat("inner", "hello"), world2bozo);

    const inner2boyo = new Replace(inner, new Atomic("boyo"));
    const c2 = new PathChange(prefix.concat("inner"), inner2boyo);

    const modifiedInner = inner.set("hello", new Atomic("bozo"));
    const updated = new Replace(modifiedInner, new Atomic("boyo"));
    const expected = [new PathChange(prefix.concat("inner"), updated), null];

    expect(c1.merge(c2)).to.deep.equal(expected);
  });

  it("merges with super path", () => {
    const inner = new Map().set("hello", new Atomic("world"));
    const prefix = ["some", 1];

    const world2bozo = new Replace(new Atomic("world"), new Atomic("bozo"));
    const c1 = new PathChange(prefix.concat("inner", "hello"), world2bozo);

    const inner2boyo = new Replace(inner, new Atomic("boyo"));
    const c2 = new PathChange(prefix.concat("inner"), inner2boyo);

    const modifiedInner = inner.set("hello", new Atomic("bozo"));
    const updated = new Replace(modifiedInner, new Atomic("boyo"));
    const expected = [null, new PathChange(prefix.concat("inner"), updated)];

    expect(c2.merge(c1)).to.deep.equal(expected);
  });
});

describe("PathChange - interop serialization", () => {
  it("should serialize", () => {
    expect(JSON.stringify(new PathChange())).to.equal("[null,null]");

    const replace = new Replace(new Null(), new Null());
    expect(JSON.stringify(new PathChange(null, replace))).to.equal(
      '[null,{"changes.Replace":[{"changes.empty":[]},{"changes.empty":[]}]}]'
    );

    expect(JSON.stringify(new PathChange([5]))).to.equal('[[{"int":5}],null]');
  });

  it("should deserialize", () => {
    const d = new FakeDecoder();
    expect(PathChange.fromJSON(d, [null, null])).to.deep.equal(
      new PathChange()
    );

    const replace = new Replace(new Null(), new Null());
    expect(
      PathChange.fromJSON(d, [
        null,
        {
          "changes.Replace": [{ "changes.empty": [] }, { "changes.empty": [] }]
        }
      ])
    ).to.deep.equal(new PathChange(null, replace));

    expect(PathChange.fromJSON(d, [[{ int: 5 }], null])).to.deep.equal(
      new PathChange([5])
    );
  });
});
