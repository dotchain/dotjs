// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { group } from "./group.js";
import { field } from "./field.js";
import { Text } from "./text.js";

/** filter calls the provided fn on all keys of the object and only retains keys for which the fn evalutes to true  */
export function filter(store, obj, fn) {
  return field(store, group(store, obj, fn), new Text('{"dotdb.Bool":true}'));
}
