// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "./decode.js";
import { Dict } from "./dict.js";

/** Store is a dictionary where the
 * default value type is also a dictionary */
export class Store extends Dict {
  constructor(map, defaultFn) {
    super(map, defaultFn || (() => new Dict()));
  }
  static typeName() {
    return "dotdb.Store";
  }
}

Decoder.registerValueClass(Store);
