// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "../../index.js";

import {
  StructDef,
  StructBase,
  ListDef,
  ListBase,
  Int,
  Bool,
  String,
  AnyType,
  makeStreamClass
} from "../../types/index.js";

let taskDef = null;
let tasksDef = null;

export class Task extends StructBase {
  constructor(done, str, mint, any) {
    super();
    this.done = done;
    this.str = str;
    this.mutableInt = mint;
    this.any = any || null;
  }

  static structDef() {
    return taskDef;
  }

  static get Stream() {
    return TaskStream;
  }
}

export class Tasks extends ListBase {
  static listDef() {
    return tasksDef;
  }

  static get Stream() {
    return TasksStream;
  }
}

taskDef = new StructDef("task", Task)
  .withField("done", "Done", Bool)
  .withField("str", "String", String)
  .withField("mutableInt", "MutableInt", Int)
  .withField("any", "Any", AnyType);

tasksDef = new ListDef("tasks", Tasks, Task);

Decoder.registerValueClass(Task);
Decoder.registerValueClass(Tasks);

export const TaskStream = makeStreamClass(Task);
export const TasksStream = makeStreamClass(Tasks);
