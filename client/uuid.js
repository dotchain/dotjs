// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateUUID is a builder for the UUID class. 
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateUUID() {
    // UUID is a generator for unique IDs
    return class UUID {
        constructor() {
            let a = new Uint32Array(2);
            // eslint-disable-next-line no-undef
            crypto.getRandomValues(a);
            this._value = a[0].toString(16) + '-' + a[1].toString(16);
        }

        toString() {
            return this._value;
        }

        toJSON() {
            return this.toString();
        }
    }
        
}
