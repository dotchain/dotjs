// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "dotjs";

import {
  StructDef,
  StructBase,
  ListDef,
  ListBase,
  Bool,
  Text,
  makeStreamClass
} from "dotjs/types/index.js";

let taskDef = null;

// Task has a boolean done field and text description
export class Task extends StructBase {
  constructor(done, description) {
    super();
    this.done = done;
    this.description = description;
  }

  static structDef() {
    // use global to avoid creating this over and over
    return taskDef;
  }

  static get Stream() {
    // this defines the stream class associated with this value
    return TaskStream;
  }
}

// actual task definition used by dotjs for help in serializing
// as well as automatic construction of stream class
taskDef = new StructDef("task", Task)
  .withField("done", "Done", Bool)
  .withField("description", "Description", Text);

// register type with decoder (only needed if used across the network)
Decoder.registerValueClass(Task);

// create a task stream automatically.
export const TaskStream = makeStreamClass(Task);

let tasksDef = null;

// Tasks is just a collection of Task
export class Tasks extends ListBase {
  static listDef() {
    return tasksDef;
  }

  static get Stream() {
    return TasksStream;
  }
}

tasksDef = new ListDef("tasks", Tasks, Task);

// register type with decoder (only needed if used across the network)
Decoder.registerValueClass(Tasks);

export const TasksStream = makeStreamClass(Tasks);
