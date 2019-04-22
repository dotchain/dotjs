// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

let changeClasses = [];

// registerChangeClass registers change types. This is needed
// for encoding/decoding change types
//
// Change classes should include a static method typeName() which
// provides the associated golang type
export function registerChangeClass(c) {
    changeClasses.push(c);
}

// decodeChange decodes a json object into one of the registered
// change types based on encoded type name
export function decodeChange(decoder, json) {
    if (json === null) {
        return null;
    }
    
    for (let c of changeClasses) {
        if (json.hasOwnProperty(c.typeName())) {
            return c.fromJSON(decoder, json[c.typeName()]);
        }
    }
}
