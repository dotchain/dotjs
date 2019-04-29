// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

// encoder serializes values, changes and types for network transmission
export class Encoder {
  static encode(value) {
    if (value === undefined || value === null) {
      return null;
    }

    if (value && value.constructor && value.constructor.typeName) {
      return { [value.constructor.typeName()]: value };
    }

    if (value instanceof Date) {
      return { "time.Time": Encoder.encodeDateValue(value) };
    }

    value = value.valueOf();
    switch (typeof value) {
      case "boolean":
        return { bool: Encoder.encodeBoolBalue(value) };
      case "number":
        return Encoder.encodeNumber(value);
      case "string":
        return { string: value };
    }

    throw new Error(
      "cannot encode unknown type: " +
        value.constructor.name +
        "\n" +
        new Error().stack
    );
  }

  static encodeBoolValue(b) {
    return b.valueOf();
  }

  static encodeNumber(i) {
    if (Number.isSafeInteger(i)) {
      return { int: i };
    }
    return { float64: i.toString() };
  }

  static encodeDateValue(date) {
    const pad = (n, width) => n.toString().padStart(width, "0");
    const offset = date.getTimezoneOffset();
    return (
      pad(date.getFullYear(), 4) +
      "-" +
      pad(date.getMonth() + 1, 2) +
      "-" +
      pad(date.getDate(), 2) +
      "T" +
      pad(date.getHours(), 2) +
      ":" +
      pad(date.getMinutes(), 2) +
      ":" +
      pad(date.getSeconds(), 2) +
      "." +
      pad(date.getMilliseconds(), 3) +
      (offset > 0 ? "-" : "+") +
      pad(Math.floor(Math.abs(offset) / 60), 2) +
      ":" +
      pad(Math.abs(offset) % 60, 2)
    );
  }

  static encodeArrayValue(a) {
    if (a === undefined || a === null) {
      return null;
    }

    return a.map(Encoder.encode);
  }
}

export const encode = Encoder.encode;
