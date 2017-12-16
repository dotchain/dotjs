// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

/*eslint no-console: "off" */

// CreateLog is a builder for the FakeLog service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateLog() {
    const logs = [];

    function add(level, prefix, logArguments) {
        const args = [];
        for (let kk = 0; kk < logArguments.length; kk ++) {
            args.push(logArguments[kk]);
        }
        
        logs.push({level, prefix, args});
    }

    return class FakeLog {
        constructor(prefix) {
            this._prefix = prefix;
        }
        log() {
            add("log", this._prefix, arguments);
        }
        warn() {
            add("warn", this._prefix, arguments);
        }
        error() {
            add("error", this._prefix, arguments);
        }
        fatal() {
            add("fatal", this._prefix, arguments);
        }
        static all() {
            return logs;
        }
        static clear() {
            logs.length = 0;
        }
    }
}
