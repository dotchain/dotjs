// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateTimer is a builder for the Timer class. 
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateTimer() {
    // Timer is a thin wrapper around standard Javascript library
    // functions that is explicitly defined as a service to allow
    // tests to simulate time-related behavior better.
    return class Timer {
        constructor(fn) {
            this._fn = fn;
            this._t = null;
        }
        now() { return Date.now(); }
        defer(interval) { 
            clearTimeout(this._t);
            this._t = setTimeout(this._fn, interval);
        }
        reset() { 
            clearTimeout(this._t);
            this._t = null;
        }
    }   
}
