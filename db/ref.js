// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "./decode.js";

import { Text } from "./text.js";
import { Value } from "./value.js";
import { field } from "./field.js";

/** Ref represents a reference to a path */
export class Ref extends Value {
  constructor(path) {
    super();
    this._path = path;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Ref(this._path);
  }

  /** run returns the underlying value at the path */
  run(store) {
    let result = store;
    for (let elt of this._path) {
      result = field(store, result, new Text(elt));
    }
    return result;
  }

  toJSON() {
    return JSON.stringify(this._path);
  }

  static typeName() {
    return "dotdb.Ref";
  }

  static fromJSON(decoder, json) {
    return new Ref(JSON.parse(json));
  }
}

Decoder.registerValueClass(Ref);
