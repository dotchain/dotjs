// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Changes } from "./changes.js";
import { Text } from "./text.js";
import { Replace } from "./replace.js";
import { PathChange } from "./path_change.js";
import { DerivedStream } from "./stream.js";
import { Null } from "./null.js";
import { Dict } from "./dict.js";
import { invoke } from "./view.js";
import { MapIterator } from "./iterators.js";

/** map calls the provided fn on all keys of the object */
export function map(store, obj, fn) {
  const f = (key, val) =>
    invoke(store, fn, toDict({ key: new Text(key), it: val }));
  return new MapStream(obj, f, null).value;
}

/** toDict takes a map where the values are streams and converts it to
 * a live dict */
export function toDict(m) {
  return new MapStream(new Dict(m), null, m).value;
}

/** MapStream implement a mapped dictionary-like stream */
class MapStream extends DerivedStream {
  constructor(base, fn, value) {
    super(base.stream);
    this.base = base;
    this.fn = fn || ((k, v) => v);
    if (!value) {
      if (typeof this.base[MapIterator] !== "function") {
        value = null;
      } else {
        value = {};

        for (let [key, val] of this.base[MapIterator]()) {
          value[key] = this.fn(key, val);
        }
      }
    }
    this._value = value;
  }

  append(c) {
    return this._append(c, false);
  }

  reverseAppend(c) {
    return this._append(c, true);
  }

  _append(c, reverse) {
    // proxy any changes to a field over to this._value
    const updated = {};
    if (!this._appendChanges(c, updated, reverse)) {
      // TODO: this is not atomic!! updated could have
      // partially changed at this point. REDO this
      return null;
    }

    const value = Object.assign({}, this._value, updated);
    const version = new MapStream(this.base, this.fn, value);
    return { change: c, version };
  }

  get value() {
    if (!this._value) {
      return new Null().setStream(this);
    }

    const m = {};
    for (let key in this._value) {
      m[key] = this._value[key].clone();
    }
    return new Dict(m).setStream(this);
  }

  _getNext() {
    const basen = this.base.next;

    if (!this._value) {
      if (!basen) {
        return null;
      }
      const version = new MapStream(basen.version, this.fn, null);
      const change = new Replace(this.value.clone(), version.value.clone());
      return { change, version };
    }

    if (basen && typeof basen.version[MapIterator] !== "function") {
      const version = new MapStream(basen.version, this.fn, null);
      const change = new Replace(this.value.clone(), version.value.clone());
      return { change, version };
    }

    const updated = Object.assign({}, this._value);
    const changes = [];

    if (basen) {
      this._updateKeys(basen.version, basen.change, updated, changes);
    }

    for (let key in this._value) {
      if (!updated.hasOwnProperty(key)) continue;
      const val = this._value[key];
      const n = val.next;
      if (n) {
        changes.push(new PathChange([key], n.change));
        updated[key] = n.version;
      }
    }

    if (changes.length === 0) {
      return null;
    }

    const change = changes.length == 1 ? changes[0] : new Changes(changes);
    const version = new MapStream(
      basen ? basen.version : this.base,
      this.fn,
      updated
    );
    return { change, version };
  }

  _updateKeys(base, c, updated, changes) {
    if (!c) {
      return;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        this._updateKeys(base, cx, updated, changes);
      }
      return;
    }

    if (!(c instanceof PathChange)) {
      return;
    }

    if ((c.path || []).length == 0) {
      return this._updateKeys(base, c.change, updated, changes);
    }

    const key = c.path[0];
    const existed = updated.hasOwnProperty(key);
    const nowExists = !(base.get(key) instanceof Null);

    if (!existed && nowExists) {
      updated[key] = this.fn(key, base.get(key));
      const replace = new Replace(new Null(), updated[key].clone());
      changes.push(new PathChange([key], replace));
    } else if (existed && !nowExists) {
      const replace = new Replace(new Null(), updated[key].clone());
      delete updated[key];
      changes.push(new PathChange([key], replace.revert()));
    }
  }

  _appendChanges(c, updated, reverse) {
    if (c instanceof Changes) {
      let result = false;
      for (let cx of c) {
        result = result || this._appendChanges(cx, updated, reverse);
      }
      return result;
    }

    if (!(c instanceof PathChange)) {
      return false;
    }

    if (!c.path || c.path.length === 0) {
      return this._appendChanges(c.change, reverse);
    }

    const key = c.path[0];
    if (this._value.hasOwnProperty(key)) {
      const cx = PathChange.create(c.path.slice(1), c.change);
      const val = this._value[key];
      // TODO: ignores reverse flag!!! Fix
      updated[key] = val.appendChange(cx);
      console.log("updated", val, "to", updated[key]);
      return true;
    }

    return false;
  }
}
