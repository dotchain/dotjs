// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Changes } from "./changes.js";
import { Replace } from "./replace.js";
import { PathChange } from "./path_change.js";
import { DerivedStream } from "./stream.js";
import { Null } from "./null.js";
import { Dict } from "./dict.js";
import { MapIterator, isMapLike } from "./iterators.js";

/** extend creates an object which has all the keys of both args */

export function extend(store, obj1, obj2) {
  return new ExtendStream(obj1, obj2).value;
}

class ExtendStream extends DerivedStream {
  constructor(obj1, obj2) {
    super(obj1.stream);
    this.obj1 = obj1;
    this.obj2 = obj2;
  }

  append(c) {
    return this._append(c, false);
  }

  reverseAppend(c) {
    return this._append(c, true);
  }

  _append(c, reverse) {
    const c1 = [];
    const c2 = [];

    this._proxyChange(c, c1, c2, {});
    if (c1.length + c2.length === 0) {
      return this;
    }

    const append = (s, c) => s && (reverse ? s.reverseAppend(c) : s.append(c));
    const s1 = append(this.obj1.stream, Changes.create(c1));
    const s2 = append(this.obj2.stream, Changes.create(c2));
    const obj1 = this.obj1
      .apply(Changes.create(c1))
      .clone()
      .setStream(s1);
    const obj2 = this.obj2
      .apply(Changes.create(c2))
      .clone()
      .setStream(s2);
    return { change: c, version: new ExtendStream(obj1, obj2) };
  }

  get value() {
    if (!isMapLike(this.obj1) && !isMapLike(this.obj2)) {
      return new Null().setStream(this);
    }

    const result = {};
    if (isMapLike(this.obj1)) {
      for (let [key, val] of this.obj1[MapIterator]()) {
        result[key] = val;
      }
    }

    if (isMapLike(this.obj2)) {
      for (let [key, val] of this.obj2[MapIterator]()) {
        result[key] = val;
      }
    }
    return new Dict(result).setStream(this);
  }

  _getNext() {
    const next1 = this.obj1.next;
    const next2 = this.obj2.next;

    if (!next1 && !next2) {
      return null;
    }

    const obj1 = next1 ? next1.version : this.obj1;
    const obj2 = next2 ? next2.version : this.obj2;
    const version = new ExtendStream(obj1, obj2);

    const changes = [];
    const redo =
      !isMapLike(this.obj1) ||
      !isMapLike(this.obj2) ||
      !isMapLike(obj1) ||
      !isMapLike(obj2) ||
      this._filterNext1(next1 && next1.change, changes) ||
      this._filterNext2(next2 && next2.change, obj1, changes);

    if (redo) {
      const change = new Replace(this.value.clone(), version.value.clone());
      return { change, version };
    }

    return { change: Changes.create(changes), version };
  }

  _filterNext1(c, changes) {
    if (!c) {
      return false;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        if (this._filterNext1(cx, changes)) return true;
      }
      return false;
    }

    if (!(c instanceof PathChange)) {
      return true;
    }

    if (!c.path || c.path.length === 0) {
      return this._filterNext1(c.change, changes);
    }

    if (!this.obj2.keyExists(c.path[0])) {
      changes.push(c);
    }

    return false;
  }

  _filterNext2(c, obj1, changes) {
    if (!c) {
      return false;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        if (this._filterNext2(cx, obj1, changes)) return true;
      }
      return false;
    }

    if (!(c instanceof PathChange)) {
      return true;
    }

    if (!c.path || c.path.length === 0) {
      return this._filterNext2(c.change, obj1, changes);
    }

    if (!obj1.keyExists(c.path[0])) {
      changes.push(c);
      return false;
    }

    const inner = [];
    const cx = PathChange.create(c.path.slice(1), c.change);
    if (this._filterOverride(cx, obj1, c.path[0], inner)) {
      return true;
    }
    if (inner.length) {
      changes.push(PathChange.create([c.path[0]], Changes.create(inner)));
    }

    return false;
  }

  _filterOverride(c, obj1, key, changes) {
    if (!c) {
      return false;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        if (this._filterOverride(cx, obj1, key, changes)) {
          return true;
        }
      }
      return false;
    }

    if (c instanceof Replace) {
      const before =
        c.before instanceof Null ? obj1.get(key).clone() : c.before;
      const after = c.after instanceof Null ? obj1.get(key).clone() : c.after;
      changes.push(new Replace(before, after));
      return false;
    }

    if (c instanceof PathChange) {
      if (!c.path || c.path.length === 0) {
        return this._filterOverride(c.change, obj1, key, changes);
      }
      changes.push(c);
      return false;
    }

    return true;
  }

  _proxyChange(c, c1, c2, removed) {
    if (!c) {
      return;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        this._proxyChange(cx, c1, c2, removed);
      }
    }

    if (!(c instanceof PathChange)) {
      throw new Error("cannot proxy change");
    }

    if (!c.path || c.path.length === 0) {
      return this._proxyChange(c.change, c1, c2, removed);
    }

    const cx = PathChange.create(c.path.slice(1), c.change);
    return this._proxyKeyChange(c.path[0], cx, c1, c2, removed);
  }

  _proxyKeyChange(key, inner, c1, c2, removed) {
    if (!inner) {
      return;
    }

    const exists1 =
      isMapLike(this.obj1) &&
      this.obj1.keyExists(key) &&
      !(removed[key] instanceof Null);
    const exists2 = isMapLike(this.obj2) && this.obj2.keyExists(key);

    if (!exists1) {
      c2.push(PathChange.create([key], inner));
      return;
    }

    const before = removed[key] || this.obj1.get(key).clone();

    if (exists1 && !exists2) {
      c1.push(PathChange.create([key], inner));
      removed[key] = before.apply(inner);
      return;
    }

    if (this._isDeletion(inner)) {
      c1.push(PathChange.create([key], new Replace(before, new Null())));
      removed[key] = new Null();
    }
    c2.push(PathChange.create([key], inner));
  }

  _isDeletion(c) {
    if (c instanceof Replace) {
      return c.after instanceof Null;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        if (this._isDeletion(cx)) {
          return true;
        }
      }
    }

    if (c instanceof PathChange) {
      if (!c.path || c.path.length === 0) {
        return this._isDeletion(c.change);
      }
    }

    return false;
  }
}
