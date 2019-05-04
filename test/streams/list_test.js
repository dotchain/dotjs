// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { TextStream, ListStream, List, Text } from "../../index.js";

describe("ListStream", () => {
  const zero = new Text("world");
  const one = new Text("world1");
  const two = new Text("world2");
  const three = new Text("world3");
  const four = new Text("world4");

  it("should replace", () => {
    const m0 = new ListStream([one]);
    const m1 = m0.replace(new List([two]));
    expect(m1.value).to.deep.equal(new List([two]));
    expect(m0.value).to.deep.equal(new List([one]));
  });

  it("should set", () => {
    const m0 = new ListStream([zero]);
    const m1 = m0.set(0, one);

    expect(m0.value).to.deep.equal(new List([zero]));
    expect(m1.value).to.deep.equal(new List([one]));

    expect(m0.latest().value).to.deep.equal(new List([one]));
  });

  it("should splice", () => {
    const m0 = new ListStream([zero]);
    const m1 = m0.splice(0, 1, new List([one]));

    expect(m0.value).to.deep.equal(new List([zero]));
    expect(m1.value).to.deep.equal(new List([one]));

    expect(m0.latest().value).to.deep.equal(new List([one]));
  });

  it("should move", () => {
    const m0 = new ListStream([zero, one, two, three, four]);
    const m1 = m0.move(1, 2, 1);

    expect(m0.value).to.deep.equal(new List([zero, one, two, three, four]));
    expect(m1.value).to.deep.equal(new List([zero, three, one, two, four]));

    expect(m0.latest().value).to.deep.equal(
      new List([zero, three, one, two, four])
    );
  });

  it("should push", () => {
    const m0 = new ListStream([zero]);
    const m1 = m0.push(one);

    expect(m0.value).to.deep.equal(new List([zero]));
    expect(m1.value).to.deep.equal(new List([zero, one]));

    expect(m0.latest().value).to.deep.equal(new List([zero, one]));
  });

  it("should pop", () => {
    const m0 = new ListStream([zero]);
    const { value, stream: m1 } = m0.pop();

    expect(m0.value).to.deep.equal(new List([zero]));
    expect(value).to.deep.equal(zero);
    expect(m1.value).to.deep.equal(new List([]));

    expect(m0.latest().value).to.deep.equal(new List([]));
  });

  it("should converge", () => {
    const m0 = new ListStream([zero]);
    const m1 = m0.replace(new List([one]));
    expect(m1.value).to.deep.equal(new List([one]));
    expect(m0.value).to.deep.equal(new List([zero]));
    expect(m0.next.version.value).to.deep.equal(new List([one]));

    expect(m1.next).to.equal(null);
    expect(m0.next.version.next).to.equal(null);
  });

  it("should converge with multiple edits", () => {
    const m0 = new ListStream([zero]);
    const m1 = m0.replace(new List([one]));
    const m2 = m0.replace(new List([two]));
    const m3 = m1.replace(new List([three]));
    const m4 = m2.replace(new List([four]));
    for (let m of [m0, m1, m2, m3, m4]) {
      expect(m.latest().value).to.deep.equal(new List([four]));
    }
  });
});

describe("ListStream.substream", () => {
  it("should track sub-stream changes", () => {
    const m0 = new ListStream([new Text("boo"), new Text("hoo")]);

    const child0 = m0.substream(0, TextStream);
    child0.splice(0, 0, "wonder");

    expect(m0.latest().value).to.deep.equal(
      new List([new Text("wonderboo"), new Text("hoo")])
    );
  });

  it("should track sub-stream indices", () => {
    const m0 = new ListStream([
      new Text("boo"),
      new Text("hoo"),
      new Text("goop")
    ]);

    const child0 = m0.substream(1, TextStream);
    const m1 = m0.splice(0, 1);
    expect(child0.latest().value).to.equal("hoo");

    child0.splice(0, 1, "z");
    expect(m1.latest().value).to.deep.equal(
      new List([new Text("zoo"), new Text("goop")])
    );
  });
});
