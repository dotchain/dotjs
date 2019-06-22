// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

const valueTypes = {};
const changeTypes = {};

// Decoder implments network serialization and deserialization
export class Decoder {
  decode(value) {
    if (value === undefined || value === null) {
      return null;
    }

    for (let key in value) {
      switch (key) {
        case "bool":
          return value.bool;
        case "int":
          return value.int;
        case "float64":
          return +value.float64;
        case "string":
          return value.string;
        case "time.Time":
          return new Date(value[key]);
      }
    }

    const val = this.decodeValue(value);
    if (val !== undefined) {
      return val;
    }

    return this.decodeChange(value);
  }

  decodeValue(v) {
    for (let key in v) {
      if (valueTypes.hasOwnProperty(key)) {
        return valueTypes[key].fromJSON(this, v[key]);
      }
    }
  }

  decodeChange(c) {
    if (c === null) {
      return null;
    }

    for (let key in c) {
      if (changeTypes.hasOwnProperty(key)) {
        return changeTypes[key].fromJSON(this, c[key]);
      }
    }
  }

  // registerValueClass registers value types. This is needed
  // for encoding/decoding value types
  //
  // Value classes should include a static method typeName() which
  // provides the associated golang type
  static registerValueClass(valueConstructor) {
    valueTypes[valueConstructor.typeName()] = valueConstructor;
  }

  // registerChangeClass registers change types. This is needed
  // for encoding/decoding change types
  //
  // Change classes should include a static method typeName() which
  // provides the associated golang type
  static registerChangeClass(changeConstructor) {
    changeTypes[changeConstructor.typeName()] = changeConstructor;
  }
}
