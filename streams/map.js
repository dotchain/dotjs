// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Substream } from "./substream.js";
import { ValueStream } from "./value.js";
import { Replace, Map, PathChange, Null } from "../core/index.js";

export class MapStream extends ValueStream {
  constructor(pairs, stream) {
    let map = pairs;
    if (pairs === null || pairs === undefined || Array.isArray(pairs)) {
      map = new Map(pairs);
    }
    if (!(map instanceof Map)) {
      throw new Error(
        "MapStream requires array of key/value pairs or dotjs.Map"
      );
    }

    super(map, stream);
  }

  set(key, value) {
    if (value === null) {
      value = new Null();
    }
    const replace = new Replace(this.value.get(key), value);
    return super.append(new PathChange([key], replace));
  }

  replace(value) {
    const after = new MapStream(value);
    return super.append(new Replace(this.value, after.value));
  }

  substream(key, ctor) {
    return new ctor(this.value.get(key), new Substream(this.stream, [key]));
  }

  static create(val, stream) {
    return new MapStream(val, stream);
  }
}
