// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { PathChange } from "./path_change.js";
import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";
import { Replace } from "./replace.js";
import { Substream } from "./substream.js";
import { Null } from "./null.js";
import { Value } from "./value.js";
import { MapIterator } from "./iterators.js";

/** Dict represents a map/hash/dictionary/collection with string keys */
export class Dict extends Value {
  constructor(initial, defaultFn) {
    super();
    this.map = initial || {};
    this._defaultFn = defaultFn || (() => new Null());
  }

  setDefaultFn(defaultFn) {
    this._defaultFn = defaultFn || (() => new Null());
  }

  /** get looks up a key and returns the value (or a default value) */
  get(key) {
    const s = new Substream(this.stream, key);
    return (this.map[key] || this._defaultFn()).setStream(s);
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Dict(this.map);
  }

  apply(c) {
    if (!c) {
      return this.clone();
    }

    if (c instanceof Replace) {
      return c.after;
    }

    if (c instanceof PathChange) {
      if (c.path === null || c.path.length === 0) {
        return this.apply(c.change);
      }
      return this._applyPath(c.path, c.change);
    }

    return c.applyTo(this);
  }

  _applyPath(path, c) {
    let val = this.map[path[0]] || this._defaultFn();
    val = val.apply(new PathChange(path.slice(1), c));
    const clone = {};
    for (let key in this.map) {
      clone[key] = this.map[key];
    }
    if (val instanceof Null) {
      delete clone[path[0]];
    } else {
      clone[path[0]] = val;
    }
    return new Dict(clone);
  }

  *[MapIterator]() {
    for (let key in this.map) {
      yield [key, this.get(key)];
    }
  }

  toJSON() {
    let all = [];
    for (let key in this.map) {
      all.push(key, Encoder.encode(this.map[key]));
    }
    return all;
  }

  static typeName() {
    return "dotdb.Dict";
  }

  static fromJSON(decoder, json) {
    json = json || [];
    const map = {};
    for (let kk = 0; kk < json.length; kk += 2) {
      map[json[kk]] = decoder.decodeValue(json[kk + 1]);
    }
    return new Dict(map);
  }
}

Decoder.registerValueClass(Dict);
