// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "dotjs";

import {
  StructDef,
  StructBase,
  Bool,
  Text,
  makeStreamClass
} from "dotjs/types/index.js";

let taskDef = null;

// define a task type with boolean done and string description
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

// register actual type with decoder (only needed if used across the network)
Decoder.registerValueClass(Task);

// create a task stream automatically.
export const TaskStream = makeStreamClass(Task);
