// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Task, Tasks, TaskStream, TasksStream } from "./defs.js";

describe("ListStream", () => {
  it("should provide substream access", () => {
    const s = new TasksStream(new Tasks(new Task()));
    const t = s.item(0);
    expect(t.value).to.equal(s.value[0]);

    t.replace(new Task(2));
    expect(s.latest().value[0]).to.deep.equal(new Task(2));
  });

  it("should remap substream index", () => {
    let s = new TasksStream(
      new Tasks(new Task(false, "1"), new Task(false, "2"))
    );
    let t = s.item(1);

    s = s.splice(0, 1);
    t = t.latest();

    expect(t.value.str).to.equal("2");
    t.replace(new Task(false, "3"));
    expect(s.latest().value).to.deep.equal(new Tasks(new Task(false, "3")));
  });

  it("should remove item", () => {
    let s = new TasksStream(
      new Tasks(new Task(false, "1"), new Task(false, "2"))
    );

    let t = s.item(0);
    t.remove();

    expect(s.latest().value).to.deep.equal(new Tasks(new Task(false, "2")));
  });

  it("should splice", () => {
    const s = new TasksStream(new Tasks(new Task(false, "2")));

    s.splice(0, 1, new Task(false, "1"));
    expect(s.latest().value).to.deep.equal(new Tasks(new Task(false, "1")));
  });

  it("should move", () => {
    const s = new TasksStream(
      new Tasks(new Task(false, "1"), new Task(false, "2"))
    );

    s.move(1, 1, -1);
    expect(s.latest().value).to.deep.equal(
      new Tasks(new Task(false, "2"), new Task(false, "1"))
    );
  });

  it("should push", () => {
    const s = new TasksStream(new Tasks(new Task()));
    const t = s.item(0);
    expect(t.value).to.equal(s.value[0]);

    s.push(new Task(2));
    expect(s.latest().value[1]).to.deep.equal(new Task(2));
  });

  it("should pop", () => {
    const s = new TasksStream(new Tasks(new Task(2), new Task(5)));
    const t = s.item(0);
    expect(t.value).to.equal(s.value[0]);

    expect(s.pop().value).to.deep.equal(new Task(5));
    expect(s.latest().value).to.deep.equal(new Tasks(new Task(2)));
  });
});

describe("StructStream", () => {
  it("should provide substream access", () => {
    const s = new TaskStream(new Task(5, "hello"));
    const t = s.str();
    expect(t.value).to.equal(s.value.str);

    t.replace("hello world");
    expect(s.latest().value.str).to.deep.equal("hello world");
  });

  it("should provide field updates", () => {
    const s = new TaskStream(new Task(5, "hello"));
    const t = s.setStr("hello world");
    expect(t.value.str).to.equal("hello world");

    expect(s.latest().value.str).to.deep.equal("hello world");
  });
});
