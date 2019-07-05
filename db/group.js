// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Changes } from "./changes.js";
import { Replace } from "./replace.js";
import { PathChange } from "./path_change.js";
import { DerivedStream } from "./stream.js";
import { Null } from "./null.js";
import { Dict } from "./dict.js";
import { MapIterator, isMapLike } from "./iterators.js";
import { map } from "./map.js";

/** group calls the provided fn on all keys of the object and
 * aggregates all items with same value of fn. It returns a
 * dictionary where the keys are groups and the values are
 * dictionaries with that group value */

export function group(store, obj, fn) {
  return new GroupStream(obj, map(store, obj, fn), null).value;
}

/** GroupStream implements a groupd dict-of-dict-like stream */
class GroupStream extends DerivedStream {
  constructor(base, groups, groupsMap) {
    super(base.stream);
    this.base = base;
    this.groups = groups;
    if (!groupsMap && isMapLike(base)) {
      groupsMap = {};
      for (let [key] of base[MapIterator]()) {
        groupsMap[key] = GroupStream._groupOf(key, groups);
      }
    }
    this.groupsMap = groupsMap;
  }

  append(c) {
    return this._proxyChange(c, false);
  }

  reverseAppend(c) {
    return this._proxyChange(c, true);
  }

  get value() {
    if (!isMapLike(this.base)) {
      return new Null().setStream(this);
    }

    const value = {};
    for (let [key] of this.base[MapIterator]()) {
      const group = GroupStream._groupOf(key, this.groups);
      value[group] = value[group] || {};
      value[group][key] = this.base.get(key).clone();
    }
    for (let group in value) {
      value[group] = new Dict(value[group]);
    }

    return GroupStream._collection(value).setStream(this);
  }

  _getNext() {
    let groupsn = this.groups.next;
    let basen = this.base.next;

    const groups = groupsn ? groupsn.version : this.groups;
    const base = basen ? basen.version : this.base;

    if (!isMapLike(this.base) || !isMapLike(base)) {
      if (!groupsn && !basen) {
        return null;
      }

      const version = new GroupStream(base, groups, null);
      const change = new Replace(new Null(), version.value.clone());
      return { change, version };
    }

    const changes = [];
    const oldGroups = {};

    for (let [key, val] of this.base[MapIterator]()) {
      const before = this.groupsMap[key];
      oldGroups[before] = 0;

      const after = GroupStream._groupOf(key, groups);
      if (before !== after) {
        const r1 = new Replace(val.clone(), new Null());
        changes.push(new PathChange([before, key], r1));
        if (base.keyExists(key)) {
          const r2 = new Replace(new Null(), val.clone());
          changes.push(new PathChange([after, key], r2));
        }
      }
    }

    // delete empty groups
    for (let [key] of base[MapIterator]()) {
      oldGroups[GroupStream._groupOf(key, groups)] = 1;
    }
    for (let group in oldGroups) {
      if (!oldGroups[group]) {
        const r = new Replace(GroupStream._collection(null), new Null());
        changes.push(new PathChange([group], r));
      }
    }

    if (!this._groupChanges(base, basen && basen.change, groups, changes)) {
      // an unsupport change type.  replace whole object
      const version = new GroupStream(base, groups, null);
      const change = new Replace(this.value.clone(), version.value.clone());
      return { change, version };
    }

    if (!changes.length) {
      return null;
    }

    const change = new Changes(changes);
    const version = new GroupStream(base, groups, null);
    return { change, version };
  }

  _groupChanges(base, c, groups, changes) {
    if (!c) {
      return true;
    }

    if (c instanceof Changes) {
      for (let cx of c) {
        if (!this._groupChanges(base, cx, groups, changes)) {
          return false;
        }
      }
      return true;
    }

    if (!(c instanceof PathChange)) {
      return false;
    }

    if (!c.path || !c.path.length) {
      return this._groupChanges(base, c.change, groups, changes);
    }

    if (base.keyExists(c.path[0])) {
      const group = GroupStream._groupOf(c.path[0], groups);
      changes.push(PathChange.create([group].concat(c.path), c.change));
    }
    return true;
  }

  _proxyChange(c, reverse) {
    if (!c) {
      return null;
    }

    if (c instanceof Changes) {
      let result = this;
      for (let cx of c) {
        result = result._proxyChange(cx, reverse);
      }
      return result;
    }

    if (!(c instanceof PathChange)) {
      throw new Error("cannot proxy change");
    }

    if (!c.path || c.path.length === 0) {
      return this._proxyChange(c.change, reverse);
    }

    const group = c.path[0];
    const change = PathChange.create(c.path.slice(1), c.change);
    return this._proxyGroupChange(group, change, reverse);
  }

  _proxyGroupChange(group, c, reverse) {
    if (!c) {
      return this;
    }

    // TODO: this breaks apart a change set
    // An append call should cause exactly one append call.
    // This can be done by simply returning the new changes + updated
    // groups map.
    if (c instanceof Changes) {
      let result = this;
      for (let cx of c) {
        result = result._proxyGroupChange(group, cx, reverse);
      }
      return result;
    }

    if (c instanceof PathChange) {
      if (!c.path || !c.path.length) {
        return this._proxyGroupChange(group, c.change, reverse);
      }

      return this._proxyInnerChange(
        group,
        c.path[0],
        PathChange.create(c.path.slice(1), c.change),
        reverse
      );
    }

    if (!(c instanceof Replace)) {
      throw new Error("unexpected change");
    }

    const changes = [];
    if (isMapLike(c.before)) {
      // delete old items
      for (let [key, before] of c.before[MapIterator]()) {
        const r = new Replace(before, new Null());
        changes.push(new PathChange([key], r));
      }
    }
    if (isMapLike(c.after)) {
      // insert new items
      for (let [key, after] of c.after[MapIterator]()) {
        const r = new Replace(new Null(), after);
        changes.push(new PathChange([key], r));
      }
    }
    return this._proxyGroupChange(group, new Changes(changes), reverse);
  }

  _proxyInnerChange(group, key, c, reverse) {
    const change = PathChange.create([key], c);
    const stream = this.base.stream;
    const updated =
      stream &&
      (reverse ? stream.reverseAppend(change) : stream.append(change));
    const base = this.base
      .clone()
      .apply(c)
      .setStream(updated);
    const groupsMap = Object.assign({}, this.groupsMap);
    groupsMap[key] = group;
    return new GroupStream(base, this.groups, groupsMap);
  }

  static _groupOf(key, groups) {
    if (!isMapLike(groups)) {
      return "";
    }
    return GroupStream.KeyString(groups.get(key));
  }

  static KeyString(val) {
    return JSON.stringify(Encoder.encode(val));
  }

  static _collection(m) {
    return new Dict(m, () => new Dict());
  }
}
