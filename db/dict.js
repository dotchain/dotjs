// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { PathChange } from "./path_change.js";
import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";
import { Replace } from "./replace.js";
import { Substream} from "./substream.js";
import { Null } from "./null.js";

/** Dict represents a map/hash/dictionary/collection with string keys */
export class Dict {
  constructor(initial, defaultFn) {
    this.stream = null;
    this.map = initial || {};
    this._defaultFn = defaultFn || (() => new Null());
  }

  setDefaultFn(defaultFn) {
    this._defaultFn = defaultFn || (() => new Null());
  }
  
  /** get looks up a key and returns the value (or a default value) */
  get(key) {
    const val = this.map[key] || this._defaultFn();
    val.stream = new Substream(this.stream, key);
    return val;
  }
  
  /** 
   * replace substitutes this with another value 
   * @returns {Value} r - r has same stream as this
   **/
  replace(replacement) {
    const change = new Replace(this.clone(), replacement.clone());
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /** clone makes a copy but with stream set to null */
  clone() {
    return new Dict(this.map);
  }

  /** @type {Object} null or {change, version} */
  get next() {
    const n = this.stream && this.stream.next;
    if (!n) return null;
    return this._nextf(n.change, n.version);
  }

  _nextf(change, version) {    
    const v = this.apply(change);
    if (v.hasOwnProperty("stream")) v.stream = version;
    return {change, version: v};
  }
  
  apply(c) {
    if (c == null) {
      return this;
    }

    if (c instanceof Replace) {
      return c.after;
    }

    if (c instanceof PathChange) {
      if (!(c instanceof PathChange)) {
        throw new Error("wat");
      }
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
    for(let key in this.map) {
      clone[key] = this.map[key];
    }
    if (val instanceof Null) {
      delete(clone, path[0])
    } else {
      clone[path[0]] = val;
    }
    return new Dict(clone);
  }
  
  toJSON() {
    let all = [];
    for (let key in this.map) {
      all.push(key, Encoder.encode(this.map[key]))
    }
    return all
  }

  static typeName() {
    return "types.Dict"
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
