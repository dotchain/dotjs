// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";

// Null represents an empty value
export class Null {
  apply(c) {
    if (!c) {
      return this;
    }
    if (c instanceof Replace && c.before instanceof Null) {
      return c.after;
    }
    return c.applyTo(this);
  }

  toJSON() {
    return [];
  }

  static typeName() {
    return "changes.empty";
  }

  static fromJSON() {
    return new Null();
  }
}
