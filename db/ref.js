// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { Encoder } from "./encode.js";
import { Decoder } from "./decode.js";

import { Replace } from "./replace.js";

const refsentinel = {};

/** Ref represents a reference to a path */
export class Ref {
  constructor(path) {
    this._path = path;
    this.stream = null;
  }

  /** 
   * replace substitutes this with another value 
   * @returns {Value} r - r has same stream as this
   **/
  replace(replacement) {
    const change = new Replace(this.clone(), replacement.clone());
    const version = this.stream && this.stream.append(change);
    return this._nextf(change, version).version;
  }

  /**
   * eval returns the underlying value that the path refers to
   */
  eval(store) {
    const result = this._eval(store);
    result.stream = new RefStream(this, store, result.stream);
    return result;
  }

  _eval(store) {
    let result = this;
    while (result instanceof Ref) {
      result = store.resolve(this._path);
    }
    return result
  }
  
  /** clone makes a copy but with stream set to null */
  clone() {
    return new Ref(this._path);
  }

  /** @type {Object} null or {change, version} */
  get next() {
    const n = this.stream && this.stream.next;
    if (!n) return null;
    return this._nextf(n.change, n.version);
  }

  _nextf(change, version) {    
    const v = this.apply(change);
    if (v.hasOwnProperty("stream")) v.stream = version;
    return {change, version: v};
  }
  
  apply(c) {
    if (!c) {
      return this;
    }

    if (c instanceof Replace) {
      return c.after;
    }
    return c.applyTo(this);
  }

  toJSON() {
    return JSON.stringify(this._path)
  }

  static typeName() {
    return "types.Ref";
  }

  static fromJSON(decoder, json) {
    return new Ref(JSON.parse(json))
  }  
}

class RefStream {
  constructor(ref, store, deref) {
    this.ref = ref;
    this.store = store;
    this.deref = deref;
    this._next = refsentinel;
  }

  append(c) {
    return this.deref.append(c);
  }

  reverseAppend(c) {
    return this.deref.reverseAppend(c);
  }

  push() {
    this.deref.push();
    return this;
  }

  pull() {
    this.deref.pull();
    return this;
  }

  undo() {
    this.deref.undo();
    return this;
  }

  redo() {
    this.deref.redo();
    return this;
  }
  
  get next() {
    if (this._next !== refsentinel) {
      return this._next;
    }
    const next = this._uncachedNext();
    if (next != null) {
      this._next = next;
    }
    return next;
  }
  
  _uncachedNext() {
    const storen = this.store.next;
    const refn = this.ref.next;
    const derefn = this.deref.next;

    if (!storen && !refn && !derefn) {
      return null;
    }

    const store = storen && storen.version || this.store;
    if (!refn && !derefn) {
      // mutate the current stream itself so that the next
      // time is faster
      this.store = storen.version;
      return null;
    }

    if (!refn) {
      // actual ref didn't change so let deref changes through
      const v = new RefStream(this.ref, store, derefn.version);
      return {change: derefn.change, version: v};
    }

    // updated version can be an "evaluatable" entity
    let updated = refn.version;
    if (updated.eval) {
      updated = updated.eval(store);
    }

    // TODO: fix this! 
    // we don't have access to the old value here, so using null.
    const change = new Replace(null, updated);
    return {change, version: updated.stream};
  }
}
