// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateNull is a builder for the Null class
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateNull(services) {
    // Null represents a null data which can represent actual nulls
    // or an empty string or a empty array depending on the situation.
    return class Null {
        toJSON() {}
        forEach() {}
        count() { return 0; }
        slice(start, end) {
            if (start === 0 && end === 0) return this;
            throw new Error("null: slice invalid params: " + [start, end]);
        }

        rangeApply(offset, count) {
            if (offset === 0 && count === 0) return this;
            throw new Error("null: rangeApply invalid params: " + [offset, count]);
        }

        splice(offset, before, after) {
            if (offset !== 0 || services.ArrayLike.count(before) !== 0) {
                throw new Error("null: invalid slice params");
            }
            return after;
        }
    }
}
