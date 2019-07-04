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
import { Bool } from "./bool.js";
import { map } from "./map.js";

/** filter calls the provided fn on all keys of the object and only retains keys for which the fn evalutes to true  */
export function filter(store, obj, fn) {
  return new FilterStream(obj, map(store, obj, fn), null).value;
}

/** FilterStream implement a filtered dictionary-like stream */
class FilterStream extends DerivedStream {
  constructor(base, filters, value) {
    super(base.stream);
    this.base = base;
    this.filters = filters;
    if (!value) {
      if (typeof this.filters[MapIterator] !== "function") {
        value = null;
      } else {
        value = {};

        for (let [key, val] of this.filters[MapIterator]()) {
          if (val instanceof Bool && val.b) {
            value[key] = this.base.get(key).clone();
          }
        }
      }
    }
    this._value = value;
  }

  get value() {
    if (!this._value) {
      return new Null().setStream(this);
    }

    return new Dict(this._value).setStream(this);
  }

  _getNext() {
    let filtersn = this.filters.next;
    if (!filtersn) {
      if (!this._value) return null;
      filtersn = { change: null, version: this.filters };
    }

    const basen = this.base.next;
    const base = basen ? basen.version : this.base;

    if (!this._value || typeof filtersn.version[MapIterator] !== "function") {
      const version = new FilterStream(base, filtersn.version, null);
      const change = new Replace(this.value.clone(), version.value.clone());
      return { change, version };
    }

    const changes = [];
    const addRemoveKeys = {};
    const value = Object.assign({}, this._value);

    for (let [key, val] of filtersn.version[MapIterator]()) {
      if (val instanceof Bool && val.b) {
        if (!value.hasOwnProperty(key)) {
          value[key] = base.get(key).clone();
          const r = new Replace(new Null(), value[key].clone());
          changes.push(new PathChange([key], r));
          addRemoveKeys[key] = true;
        }
      } else if (value.hasOwnProperty(key)) {
        const r = new Replace(value[key].clone(), new Null());
        delete value[key];
        changes.push(new PathChange([key], r));
        addRemoveKeys[key] = true;
      }
    }

    this._filterChanges(
      base,
      basen && basen.change,
      addRemoveKeys,
      value,
      changes
    );
    if (!changes.length) {
      return null;
    }
    const change = new Changes(changes);
    const version = new FilterStream(base, filtersn.version, value);
    return { change, version };
  }

  _filterChanges(base, c, ignoreKeys, value, changes) {
    if (!c) {
      return;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        this._filterChanges(base, cx, ignoreKeys, value, changes);
      }
      return;
    }

    if (!(c instanceof PathChange)) {
      throw new Error("unexpected change type");
    }

    if (!c.path || !c.path.length) {
      return this._filterChanges(base, c.change, ignoreKeys, value, changes);
    }

    if (!ignoreKeys[c.path[0]]) {
      changes.push(c);
      value[c.path[0]] = base.get(c.path[0]).clone();
    }
  }
}
