// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import {
  Atomic,
  Null,
  Encoder,
  Replace,
  PathChange,
  Text as CoreText,
  TextStream,
  ValueStream
} from "../index.js";

// StructBase can be used to simplify creating structs
export class StructBase {
  toJSON() {
    return this.constructor.structDef().toJSON(this);
  }

  apply(c) {
    return this.constructor.structDef().apply(this, c);
  }

  static typeName() {
    return this.structDef().typeName;
  }

  static fromJSON(decoder, json) {
    return this.structDef().fromJSON(decoder, json);
  }
}

export class StructDef {
  constructor(typeName, ctor) {
    this.typeName = typeName;
    this._ctor = ctor;
    this._fields = [];
  }

  withField(propName, serializationName, propCtor) {
    this._fields.push(new Field(propName, serializationName, propCtor));
    return this;
  }

  apply(obj, c) {
    if (!c) {
      return obj;
    }

    if (c instanceof Replace) {
      return c.after;
    }

    if (c instanceof PathChange) {
      if (c.path === null || c.path.length === 0) {
        return this.apply(obj, c.change);
      }
      const inner = new PathChange(c.path.slice(1), c.change);
      return this._applyField(obj, c.path[0], inner);
    }

    return c.applyTo(obj);
  }

  _applyField(obj, fieldName, change) {
    const fields = [];
    for (let field of this._fields) {
      if (field.is(fieldName)) {
        fields.push(field.apply(obj, change));
      } else {
        fields.push(field.get(obj));
      }
    }
    return new this._ctor(...fields);
  }

  _replaceField(obj, fieldName, value) {
    const fields = [];
    for (let field of this._fields) {
      if (field.is(fieldName)) {
        fields.push(value);
      } else {
        fields.push(field.get(obj));
      }
    }
    return new this._ctor(...fields);
  }

  toJSON(obj) {
    const result = [];
    for (let field of this._fields) {
      result.push(field.toJSON(obj));
    }
    return result;
  }

  fromJSON(decoder, json) {
    const fields = [];
    for (let idx = 0; idx < this._fields.length; idx++) {
      fields.push(this._fields[idx].fromJSON(decoder, json[idx]));
    }
    return new this._ctor(...fields);
  }
}

class Field {
  constructor(propName, fieldName, ctor) {
    this._propName = propName;
    this._fieldName = fieldName;
    this._ctor = ctor;
  }

  is(fieldName) {
    return this._fieldName === fieldName;
  }

  get(obj) {
    return obj[this._propName];
  }

  wrapValue(val) {
    if (this._ctor && this._ctor.wrap) {
      return this._ctor.wrap(val);
    }

    if (this._ctor === null || this._ctor.prototype.apply) {
      return val;
    }

    const nil = val === undefined || val === null;
    return nil ? new Null() : new Atomic(val);
  }

  unwrapValue(val) {
    if (this._ctor && this._ctor.unwrap) {
      return this._ctor.unwrap(val);
    }

    if (this._ctor === null || this._ctor.prototype.apply) {
      return val;
    }

    if (val instanceof Atomic) {
      return val.value;
    }
    return null;
  }

  apply(obj, c) {
    return this.unwrapValue(this.wrapValue(obj[this._propName]).apply(c));
  }

  toJSON(obj) {
    const prop = obj[this._propName];
    if (this._ctor === null) {
      return Encoder.encode(prop);
    }

    if (prop && prop.toJSON) {
      return prop.toJSON();
    }

    if (this._ctor.toJSON) {
      return this._ctor.toJSON(prop);
    }
    return prop;
  }

  fromJSON(decoder, json) {
    if (this._ctor === null) {
      return decoder.decode(json);
    }

    return this._ctor.fromJSON(decoder, json);
  }
}

export const Bool = nativeType("bool", "Bool");
export const Int = nativeType("int", "Int");
export const String = nativeType("string", "String");
export class Text extends CoreText {
  static wrap(v) {
    return new Text(v);
  }

  static unwrap(v) {
    return v.text;
  }

  static get Stream() {
    return TextStream;
  }
}

export const Date = nativeType("time.Time", "Time");
export const Float = nativeType("float64", "Float");
export const AnyType = null;

function nativeType(typeName, displayName, streamClass) {
  let toJSON = v => v;
  let fromJSON = (decoder, json) => decoder.decode({ [typeName]: json });

  switch (typeName) {
    case "bool":
      toJSON = v => (Boolean(v) ? true : false);
      break;
    case "int":
      toJSON = v => (Number.isSafeInteger(+v) ? +v : 0);
      break;
    case "string":
      toJSON = v => (v || "").toString();
      break;
    case "time.Time":
      toJSON = v => Encoder.encode(v)["time.Time"];
      break;
    case "float64":
      toJSON = v => (isNaN(+v) ? 0 : +v).toString();
      break;
  }

  const t = class {
    constructor(v) {
      this.native = v;
    }

    toJSON() {
      return toJSON(this.native);
    }

    static toJSON(obj) {
      return toJSON(obj);
    }
    static fromJSON(decoder, json) {
      return fromJSON(decoder, json);
    }
    static get Stream() {
      return streamClass || ValueStream;
    }
  };

  const typed = { [displayName]: t };
  return typed[displayName];
}
