// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

/*eslint no-console: "off" */

// CreateLog is a builder for the Log service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateLog() {
    // Log implements a thin wrapper around console.log which would be
    // useful eventually when richer logging is needed.
    return class Log {
        constructor(prefix) {
            this._prefix = prefix;
        }
        log() {
            const args = [this._prefix]
            for (let kk = 0; kk < arguments.length; kk ++) {
                args.push(arguments[kk]);
            }
            console.log.apply(console, args);
        }
        warn() {
            const args = [this._prefix]
            for (let kk = 0; kk < arguments.length; kk ++) {
                args.push(arguments[kk]);
            }
            console.warn.apply(console, args);
        }
        error() {
            const args = [this._prefix]
            for (let kk = 0; kk < arguments.length; kk ++) {
                args.push(arguments[kk]);
            }
            console.error.apply(console, args);
        }
        fatal() {
            const args = ['FATAL', this._prefix]
            for (let kk = 0; kk < arguments.length; kk ++) {
                args.push(arguments[kk]);
            }
            console.error.apply(console, args);
        }
    }
}
