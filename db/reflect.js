// Copyright (C) 2017 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Decoder } from "./decode.js";
import { Dict } from "./dict.js";
import { RunStream } from "./run.js";
import { Value } from "./value.js";
import { field, FieldStream } from "./field.js";
import { invoke, InvokeStream, View } from "./view.js";
import { extend } from "./extend.js";

/** Reflect introspects values and returns meta properties */
export class Reflect {
  /** Definition returns the definition of the value
   * Calling run(store, def(val)) will produce the value itself.
   * Definitions can be stored.
   */
  static definition(val) {
    const s = val.stream;
    if (s instanceof RunStream) {
      return Reflect.definition(s.obj);
    }
    if (s instanceof FieldStream) {
      return new View(
        new Dict({
          viewFn: new FieldFn(),
          obj: Reflect.definition(s.obj),
          key: Reflect.definition(s.key)
        })
      );
    }
    if (s instanceof InvokeStream) {
      // field(store, this.info, new Text("viewFn"))
      if (s.fn.stream instanceof FieldStream) {
        if (
          s.fn.stream.key instanceof Text &&
          s.fn.stream.key.text == "viewFn"
        ) {
          // this is actually an invoke stream of a View
          return new View(s.fn.stream.obj.clone());
        }
      }
      const fn = Reflect.definition(s.fn);
      const args = Reflect.definition(s.args);
      return new View(extend(args, new Dict({ viewFn: fn() })).clone());
    }

    return val.clone();
  }

  static get FieldFn() {
    return FieldFn;
  }
}

class FieldFn extends Value {
  invoke(store, args) {
    return field(store, args.get("obj"), args.get("key"));
  }

  clone() {
    return new FieldFn();
  }

  static typeName() {
    return "dotdb.FieldFn";
  }
}
Decoder.registerValueClass(FieldFn);
