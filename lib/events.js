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
export function CreateEvents(services) {
    function noop() {}
    
    // Events is a very thin node.js style event emitter pattern that
    // is meant to be copyable (so it can be used by immutable objects
    // without copying subscriptions).
    //
    // Unlike node.js event emitters, this only supports one argument
    // for the events for performance reasons.
    //
    // It also returns a function that can be used to remove the
    // callback.
    return class Events {
        // If the ctor/dtor parameters are provided, they are called
        // before the first subscription is added and after the last
        // subscription is removed (respectively).
        constructor(ctor, dtor) {
            this._count = 0;
            this._subs = null;
            this._ctor = ctor || noop;
            this._dtor = dtor || noop;
        }

        // on registeres a subscription (callback) for the event.  The
        // callback is called with the event as same parameters as
        // emit.  Removing a subscription requires calling the
        // returned closure.
        on(event, sub) {
            if (this._count === 0) {
                this._subs = {};
                this._ctor();
            }
            this._subs[event] = this._subs[event] || [];
            const obj = {sub}
            this._subs[event].push(obj)
            this._count ++;
            return () => this._remove(obj);
        }

        _remove(obj) {
            if (obj.sub === null) return;
            obj.sub = null;
            this._count --;
            if (this._count === 0) {
                this._subs = null;
                this._dtor();
            }
        }

        // emit emits an event with a single parameter. multiple
        // parameters are not supported. 
        emit(event, args) {
            if (this._count === 0 || !this._subs[event]) return;
            const subs = this._subs[event];
            let emitted = false;
            for (let kk = 0; kk < subs.length; kk ++) {
                if (!subs[kk].sub) continue;
                emitted = true;
                this._fire(subs[kk].sub, event, args);
            }

            if (!emitted) {
                delete this._subs[event];
                return;
            }
            
            for (let kk = subs.length - 1; kk >= 0; kk --) {
                if (subs[kk].sub == null) subs.splice(kk, 1)
            }
        }

        _fire(cb, event, args) {
            try {
                cb(event, args);
            } catch (e) {
                if (services && services.Log) {
                    (new services.Log('events: ')).error("error", e);
                }
            }
        }
    }
}
