// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

import { Replace } from "./replace.js";
import { PathChange } from "./path_change.js";
import { Changes } from "./changes.js";
import { Splice } from "./splice.js";
import { Move } from "./move.js";

import { Null } from "./null.js";
import { Atomic } from "./atomic.js";
import { Map } from "./map.js";
import { Text } from "./text.js";
import { List } from "./list.js";

//
// The type registrations are done here because of
// import cycles -- the types are partially defined
// within and seem to cause issues in Chrome
//

Decoder.registerChangeClass(Replace);
Decoder.registerChangeClass(PathChange);
Decoder.registerChangeClass(Changes);
Decoder.registerChangeClass(Splice);
Decoder.registerChangeClass(Move);

Decoder.registerValueClass(Null);
Decoder.registerValueClass(Atomic);
Decoder.registerValueClass(Map);
Decoder.registerValueClass(Text);
Decoder.registerValueClass(List);

export {
  Encoder,
  Decoder,
  Replace,
  PathChange,
  Changes,
  Splice,
  Move,
  Null,
  Atomic,
  Map,
  Text,
  List
};
