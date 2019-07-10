// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Replace } from "./replace.js";
import { DerivedStream } from "./stream.js";

/** run evaluates a runnable object, such as Ref */
export function run(store, obj) {
  return new RunStream(store, obj, null).value;
}

export class RunStream extends DerivedStream {
  constructor(store, obj, value) {
    if (!value) {
      value = obj;
      if (value.run) {
        value = run(store, value.run(store));
      }
    }

    super(value.stream);

    this.value = value.clone().setStream(this);
    this.store = store;
    this.obj = obj;
  }

  append(c) {
    return this._nextf(this.parent && this.parent.append(c));
  }

  reverseAppend(c) {
    return this._nextf(this.parent && this.parent.reverseAppend(c));
  }

  _nextf(n) {
    if (!n) {
      return null;
    }
    const val = this.value.apply(n.change).setStream(n.version);
    const version = new RunStream(this.store, this.obj, val);
    return { change: n.change, version };
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
      // evaluated value has changed
      const value = this.value.apply(valuen.change).setStream(valuen.version);
      const version = new RunStream(this.store, this.obj, value);
      return { change: valuen.change, version };
    }

    return null;
  }
}
