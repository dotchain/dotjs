// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateEvents is a builder for the Events class
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateEvents() {
    // Events is a very thin node.js style event emitter pattern that
    // is meant to be copyable (so it can be used by immutable objects
    // without copying subscriptions).
    //
    // Unlike node.js event emitters, this only supports one argument
    // for the events for performance reasons.
    //
    // It also returns a function that can be used to remove the
    // callback
    const empty = [];
    return class Events {
        constructor() {
            this._subs = null;
        }
        on(event, sub) {
            this._subs = this._subs || {}
            this._subs[event] = this._subs[event] || [];
            const obj = {sub}
            this._subs[event].push(obj)
            return () => (obj.sub = null);
        }
        emit(event, args) {
            const subs = this._subs && this._subs[event] || empty;
            for (let kk = 0; kk < subs.length; kk ++) {
                subs[kk].sub && subs[kk].sub(event, args);
            }
            for (let kk = subs.length - 1; kk >= 0; kk --) {
                if (subs[kk].sub == null) subs.splice(kk, 1)
            }
        }
    }
}
