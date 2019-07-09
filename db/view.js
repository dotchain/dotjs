// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";
import { Text } from "./text.js";
import { Value } from "./value.js";
import { Replace } from "./replace.js";
import { PathChange } from "./path_change.js";
import { Substream } from "./substream.js";
import { DerivedStream } from "./stream.js";
import { run } from "./run.js";
import { field } from "./field.js";
import { Null } from "./null.js";

/** invoke invokes a function reactively */
export function invoke(store, fn, args) {
  return new InvokeStream(store, run(store, fn), run(store, args), null).value;
}

export class InvokeStream extends DerivedStream {
  constructor(store, fn, args, value) {
    if (!value) {
      if (!fn.invoke) {
        value = new Null();
      } else {
        value = fn.invoke(store, args);
      }
    }

    super(value.stream);

    this.value = value.clone().setStream(this);
    this.store = store;
    this.fn = fn;
    this.args = args;
  }

  _getNext() {
    const n = this.store.next;
    if (n) {
      this.store = n.version;
    }

    const fnNext = this.fn.next;
    const argsNext = this.args.next;
    if (fnNext || argsNext) {
      const fn = fnNext ? fnNext.version : this.fn;
      const args = argsNext ? argsNext.version : this.args;
      const updated = new InvokeStream(this.store, fn, args, null).value;
      const change = new Replace(this.value.clone(), updated.clone());
      return { change, version: updated.stream };
    }

    const valuen = this.parent && this.parent.next;
    if (valuen) {
      // evaluated value has changed
      const value = this.value.apply(valuen.change);
      const version = new InvokeStream(
        this.store,
        this.fn,
        this.args,
        value.setStream(valuen.version)
      );
      return { change: valuen.change, version };
    }

    return null;
  }
}

/** View stores a calculation that invokes a stored fn and args */
export class View extends Value {
  constructor(info) {
    super();
    this.info = info || new Null();
  }

  /** clone returns a copy with the stream set to null */
  clone() {
    return new View(this.info);
  }

  run(store) {
    return invoke(
      store,
      field(store, this.info, new Text("viewFn")),
      this.info
    );
  }

  apply(c) {
    if (!(c instanceof PathChange)) return super.apply(c);

    if (!c.path || c.path.length == 0) {
      return this.apply(c.change);
    }
    if (c.path[0] != "info") {
      throw new Error("unexpected field: " + c.path[0]);
    }
    const pc = new PathChange(c.path.slice(1), c.change);
    return new View(this.info.apply(pc));
  }

  get(key) {
    if (key != "info") {
      throw new Error("unexpected key: " + key);
    }
    return this.info.clone().setStream(new Substream(this.stream, "info"));
  }

  toJSON() {
    return Encoder.encode(this.info);
  }

  static typeName() {
    return "dotdb.View";
  }

  static fromJSON(decoder, json) {
    return new View(decoder.decode(json));
  }
}

Decoder.registerValueClass(View);
