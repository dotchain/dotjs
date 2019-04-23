// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {encode} from './encode.js';

export class ImmutableMap {
    constructor(pairs) {
        this._pairs = pairs;
    }

    _equal(v1, v2) {
        return JSON.stringify(encode(v1)) === JSON.stringify(encode(v2));
    }
    
    has(key) {
        for (let pair of this._pairs) {
            if (this._equal(pair[0], key)) {
                return true;
            }
        }
        return false;
    }        

    get(key) {
        for (let pair of this._pairs) {
            if (this._equal(pair[0], key)) {
                return pair[1];
            }
        }
    }

    set(key, value) {
        const cloned = [];
        for (let pair of this._pairs) {
            if (!this._equal(pair[0], key)) {
                cloned.push(pair);
            }
        }
        cloned.push([key, value]);
        return new ImmutableMap(cloned);
    }

    remove(key) {
        const cloned = [];
        for (let pair of this._pairs) {
            if (!this._equal(pair[0], key)) {
                cloned.push(pair);
            }
        }
        return new ImmutableMap(cloned);
    }

    *[Symbol.iterator]() {
        for (let pair of this._pairs) {
            yield pair;
        }
    }
}
