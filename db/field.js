// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "./decode.js";
import { Text } from "./text.js";
import { Value } from "./value.js";
import { Replace } from "./replace.js";
import { DerivedStream } from "./stream.js";
import { run } from "./run.js";
import { Null } from "./null.js";

export function field(store, obj, key) {
  return new FieldStream(store, run(store, obj), run(store, key), null).value;
}

class FieldStream extends DerivedStream {
  constructor(store, obj, key, value) {
    if (!value) {
      if (!key.text) {
        value = new Null();
      } else if (obj.collection) {
        value = obj.collection(key.text);
      } else if (obj.get) {
        value = obj.get(key.text);
      } else {
        value = new Null();
      }
    }

    super(value.stream);

    value = value.clone();
    value.stream = this;
    this.value = value;
    this.store = store;
    this.obj = obj;
    this.key = key;
  }

  _getNext() {
    const n = this.store.next;
    if (n) {
      this.store = n.version;
    }

    const objn = this.obj.next;
    const keyn = this.key.next;
    if (objn || keyn) {
      const obj = objn ? objn.version : this.obj;
      const key = keyn ? keyn.version : this.key;
      const updated = new FieldStream(this.store, obj, key, null).value;
      const change = new Replace(this.value.clone(), updated.clone());
      return { change, version: updated.stream };
    }

    const valuen = this.parent && this.parent.next;
    if (valuen) {
      // runuated value has changed
      const version = new FieldStream(
        this.store,
        this.obj,
        this.key,
        valuen.version
      );
      return { change: valuen.change, version };
    }

    return null;
  }
}

export class Field extends Value {
  invoke(store, args) {
    const obj = field(store, args, new Text("obj"));
    const key = field(store, args, new Text("field"));
    return field(store, obj, key);
  }

  toJSON() {
    return null;
  }

  static typeName() {
    return "dotdb.Field";
  }

  static fromJSON() {
    return new FieldFn();
  }
}

Decoder.registerValueClass(Field);
