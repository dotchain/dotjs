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

/** StructBase is the base class for custom structs. */
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

  /* derived classes must override this
   * @return {StructDef}
   */
  static get structDef() {}

  static fromJSON(decoder, json) {
    return this.structDef().fromJSON(decoder, json);
  }
}

/** StructDef defines a struct by providing its fields and constructors */
export class StructDef {
  /* @param {string} typeName - this is used across the network.
   * @param {StructBase} ctor - this is typically extended from StructBase.
   */
  constructor(typeName, ctor) {
    this.typeName = typeName;
    this._ctor = ctor;
    this._fields = [];
  }

  /* specify the field characteristics
   * @param {string} propName - name of the prop in the struct.
   * @param {string} serializationName - name used across the network.
   * @param {class} propCtor - the class of the prop.
   * @returns {StructDef}
   * for atomic properties, use one of the types constructurs such as
   * {@link Int}, {@link Bool} or {@link Text}.
   *
   */
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

/** Bool field constructor to be used with {@link StructDef.withField} */
export const Bool = nativeType("bool", "Bool");

/** Int field constructor to be used with {@link StructDef.withField} */
export const Int = nativeType("int", "Int");

/** String field constructor to be used with {@link StructDef.withField}.
 * See also {@link Text} */
export const String = nativeType("string", "String");

/** TExt field constructor to be used with {@link StructDef.withField}.
 * This supports splicing the text itself rather than just replacing it.
 */
export class Text extends CoreText {
  static wrap(v) {
    return new Text(v);
  }

  static toJSON(v) {
    return new Text(v).toJSON();
  }

  static fromJSON(decoder, json) {
    return Text.fromJSON(decoder, json).text;
  }

  static unwrap(v) {
    return v.text;
  }

  static get Stream() {
    return TextStream;
  }
}

/** Date field constructor to be used with {@link StructDef.withField} */
export const Date = nativeType("time.Time", "Time");

/** Float field constructor to be used with {@link StructDef.withField} */
export const Float = nativeType("float64", "Float");

/** Generic field constructor to be used with {@link StructDef.withField} */
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
