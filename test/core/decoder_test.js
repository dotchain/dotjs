// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { decode } from "../../index.js";

// FakeDecoder can decode only null or values
export class FakeDecoder {
  decode(json) {
    return decode(this, json);
  }
}
