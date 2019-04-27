// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

import { PathChange } from "./path_change.js";
import { Replace } from "./replace.js";
import { Null } from "./null.js";
import { ImmutableMap } from "./immutable.js";

// applyMap implements apply() for map-like objects which have
// get and set methods
export function applyMap(obj, c) {
  if (c == null) {
    return obj;
  }

  if (c instanceof Replace) {
    if (c.isDelete()) {
      return new Null();
    }
    return c.after;
  }

  if (c instanceof PathChange) {
    if (c.path === null || c.path.length === 0) {
      return obj.apply(c.change);
    }
    const pc = new PathChange(c.path.slice(1), c.change);
    return obj.set(c.path[0], obj.get(c.path[0]).apply(pc));
  }

  return c.applyTo(obj);
}

// Map implements a generic immutable map
export class Map {
  constructor(pairs) {
    if (pairs === undefined || pairs === null) {
      pairs = [];
    }
    if (!(pairs instanceof ImmutableMap)) {
      pairs = new ImmutableMap(pairs);
    }
    this._pairs = pairs;
  }

  get(key) {
    return this._pairs.get(key) || new Null();
  }

  set(key, value) {
    if (value instanceof Null) {
      return new Map(this._pairs.remove(key));
    }
    return new Map(this._pairs.set(key, value));
  }

  apply(c) {
    return applyMap(this, c);
  }

  toJSON() {
    let all = [];
    for (let pair of this._pairs) {
      all.push(...Encoder.encodeArrayValue(pair));
    }
    return all;
  }

  static typeName() {
    return "changes/types.M";
  }

  static fromJSON(decoder, json) {
    if (json == null) {
      return new Map();
    }
    const pairs = [];
    for (let kk = 0; kk < json.length; kk += 2) {
      pairs.push([decoder.decode(json[kk]), decoder.decodeValue(json[kk + 1])]);
    }
    return new Map(pairs);
  }
}

Decoder.registerValueClass(Map);
