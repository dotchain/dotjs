// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Task, Tasks, TaskStream, TasksStream } from "./custom_struct.js";

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

it("custom list example", () => {
  // create a couple of tasks (which is defined in custom_struct.js)
  let tasksValue = new Tasks(
    new Task(false, "Incomplete 1"),
    new Task(false, "incomplete 2")
  );

  // create a tasks stream out of that
  let tasks = new TasksStream(tasksValue);

  // get the description of the second task as a TextStream
  let description = tasks.item(1).description();

  // "incomplete 2" => "Incomplete 2"
  description = description.splice(0, 1, "I");

  // now confirm latest tasks matches
  expect(tasks.latest().value[1].description).to.equal("Incomplete 2");
});

it("custom list example with renumbered indices", () => {
  // create a couple of tasks (which is defined in custom_struct.js)
  let tasksValue = new Tasks(
    new Task(false, "Incomplete 1"),
    new Task(false, "incomplete 2")
  );

  // create a tasks stream out of that
  let tasks = new TasksStream(tasksValue);

  // get the description of the second task as a TextStream
  let description = tasks.item(1).description();

  // splice an task at index 0; this should change index of
  // description to 2.
  tasks = tasks.splice(0, 0, new Task(true, "Completed"));
  description = description.latest();

  // now update description: "incomplete 2" => "Incomplete 2"
  description = description.splice(0, 1, "I");

  // now confirm latest tasks matches at index 2
  expect(tasks.latest().value[2].description).to.equal("Incomplete 2");
});
