// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {decodeChange} from './change.js';
import {decodeValue} from './value.js';

// decode deserializes a value
export function decode(decoder, value) {
    if (value === undefined || value === null) {
        return null;
    }

    if (value.hasOwnProperty("bool")) {
        return value.bool;
    }

    if (value.hasOwnProperty("int")) {
        return value.int;
    }

    if (value.hasOwnProperty("float64")) {
        return +value.float64;
    }

    if (value.hasOwnProperty("string")) {
        return value.string;
    }
    
    const val = decodeValue(decoder, value);
    if (val !== undefined) {
        return val;
    }

    const c = decodeChange(decoder, value);
    if (c !== undefined) {
        return c;
    }
}
