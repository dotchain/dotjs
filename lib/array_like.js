// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateModelArray is a builder for the ModelArray class. 
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateModelArray(services) {
    const empty = [];

    // ModelArray is an effective singleton -- specific classes are
    // implemented by using the `ofConstructor` sub method.
    return class ModelArray {
        static forEach(data, cb) {
            const json = data || empty;
            if (!Array.isArray(json)) {
                if (data.forEach) return data.forEach(cb);
                if (data["dot:encoding"] == "SparseArray") {
                    return new services.SparseArray(data).forEach(cb);
                }
                throw new Error("modelarray: not an array");
            } 

            for (let kk = 0; kk < json.length; kk ++) cb(json[kk], kk);
        }

        static count(data) {
            const json = data || empty;
            if (Array.isArray(json)) return json.length;
            if (data.count) return data.count();
            if (data["dot:encoding"] == "SparseArray") {
                return new services.SparseArray(data).count();
            }
            throw new Error("modelarray: not an array");
        }
    }
}
