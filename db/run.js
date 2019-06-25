// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { DerivedStream } from "./stream.js";

export function run(store, obj) {
  return new RunStream(store, obj, null).value;
}

class RunStream extends DerivedStream {
  constructor(store, obj, value) {
    if (!value) {
      value = obj;
      if (value.run) {
        value = run(store, value.run(store));
      }
    }

    super(value.stream);

    value = value.clone();
    value.stream = this;
    this.value = value;

    this.store = store;
    this.obj = obj;
  }

  _getNext() {
    const n = this.store.next;
    if (n) {
      this.store = n.version;
    }

    const objn = this.obj.next;
    if (objn) {
      // object definition has changed
      const updated = run(this.store, objn.version);
      const change = new Replace(this.value.clone(), updated.clone());
      return { change, version: updated.stream };
    }

    const valuen = this.parent && this.parent.next;
    if (valuen) {
      // runuated value has changed
      const version = new RunStream(this.store, this.obj, valuen.version);
      return { change: valuen.change, version };
    }

    return null;
  }
}
