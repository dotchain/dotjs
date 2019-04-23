// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

// encode serializes a value and also includes its type along with it
export function encode(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (value && value.constructor && value.constructor.typeName) {
    return { [value.constructor.typeName()]: value };
  }

  value = value.valueOf();
  if (typeof value == "boolean") {
    return { bool: value };
  }

  if (Number.isSafeInteger(value)) {
    return { int: value };
  }

  if (typeof value == "number") {
    return { float64: value.toString() };
  }

  if (typeof value == "string") {
    return { string: value };
  }

  throw "cannot encode, unknown type: " + value;
}
