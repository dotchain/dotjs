// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import {
  Atomic,
  Null,
  Encoder,
  Replace,
  Splice,
  PathChange
} from "../core/index.js";

// ListBase can be used to simplify creating Lists
export class ListBase extends Array {
  toJSON() {
    return this.constructor.listDef().toJSON(this);
  }

  apply(c) {
    return this.constructor.listDef().apply(this, c);
  }

  static typeName() {
    return this.listDef().typeName;
  }

  static fromJSON(decoder, json) {
    return this.listDef().fromJSON(decoder, json);
  }
}

export class ListDef {
  constructor(typeName, listCtor, eltCtor) {
    this.typeName = typeName;
    this._listCtor = listCtor;
    this._eltCtor = eltCtor;
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
      return this._applyItem(obj, c.path[0], inner);
    }

    if (c instanceof Splice) {
      const left = this.slice(0, c.offset);
      const right = this.slice(c.offset + c.before.length);
      return left.concat(c.after).concat(right);
    }

    return c.applyTo(obj);
  }

  _applyItem(obj, idx, c) {
    const entries = obj.slice();

    if (c instanceof PathChange && (c.path === null || c.path.length === 0)) {
      c = c.change;
    }

    const elt = entries[idx];
    if (this._eltCtor === null || this._eltCtor.prototype.apply) {
      entries[idx] = elt.apply(c);
    } else {
      const nil = elt === undefined || elt === null;
      const v = nil ? new Null() : new Atomic(elt);
      const applied = v.apply(c);
      entires[idx] = applied instanceof Atomic ? applied.value : null;
    }

    return entries;
  }

  toJSON(obj) {
    const result = [];
    for (let elt of obj) {
      if (this._eltCtor === null) {
        result.push(Encoder.encode(elt));
      } else if (elt && elt.toJSON) {
        result.push(elt.toJSON());
      } else if (this._eltCtor.toJSON) {
        result.push(this._eltCtor.toJSON(elt));
      } else {
        result.push(elt);
      }
    }
    return result;
  }

  fromJSON(decoder, json) {
    let decode = x => decoder.decode(x);
    if (this._eltCtor !== null) {
      decode = x => this._eltCtor.fromJSON(decoder, x);
    }

    return this._listCtor.from((json || []).map(decode));
  }
}
