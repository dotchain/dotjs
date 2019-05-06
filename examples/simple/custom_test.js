// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Task, TaskStream } from "./custom_struct.js";

it("custom struct example", () => {
  // create a task stream (which is defined in custom_struct.js)
  let task = new TaskStream(new Task(false, "incomplete task"));

  // note that the description field here is a TextStream
  // because it is a field of TaskStream (not Task).
  let descStream = task.description();

  // now update the description and see it reflected on parent.
  descStream = descStream.replace("task not yet completed");
  task = task.latest();

  // the following fetches the actual Task value via `.value`
  expect(task.value.description).to.equal("task not yet completed");
});
