// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

let valueClasses = [];

// registerValueClass registers value types. This is needed
// for encoding/decoding value types
//
// Value classes should include a static method typeName() which
// provides the associated golang type
export function registerValueClass(v) {
    valueClasses.push(v)
}

// decodeValue decodes a json object into one of the registered
// value types based on encoded type name
export function decodeValue(decoder, json) {
    // value cannot be null, so no need to check if json === null
    for (let v of valueClasses) {
        if (json.hasOwnProperty(v.typeName())) {
            return v.fromJSON(decoder, json[v.typeName()])
        }
    }
}
