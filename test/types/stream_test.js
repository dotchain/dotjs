// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { StringStream } from "../../index.js";
import { Task, Tasks, TaskStream, TasksStream } from "./defs.js";

describe("ListStream", () => {
  it("should provide substream access", () => {
    const s = new TasksStream(new Tasks(new Task()));
    const t = s.item(0);
    expect(t.value).to.equal(s.value[0]);

    t.replace(new Task(2));
    expect(s.latest().value[0]).to.deep.equal(new Task(2));
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
    const t = s.str(StringStream);
    expect(t.value).to.equal(s.value.str);

    t.replace("hello world");
    expect(s.latest().value.str).to.deep.equal("hello world");
  });
});
