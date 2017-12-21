// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateSparseArray} from '../lib/sparse_array.js';
import {CreateArrayLike} from '../lib/array_like.js';

describe('Array tests', () => {
    const services = {};
    services.SparseArray = CreateSparseArray(services);
    services.ArrayLike = CreateArrayLike(services);
    
    it ('counts arrays and array-like objects', () => {
        const zero1 = services.ArrayLike.count();
        const zero2 = services.ArrayLike.count(null);
        const zero3 = services.ArrayLike.count("");
        const zero4 = services.ArrayLike.count([]);
        const zero5 = services.ArrayLike.count({"dot:encoding": "SparseArray"});
        const zero6 = services.ArrayLike.count({"dot:encoding": "SparseArray", "dot:encoded": []});
        const zero7 = services.ArrayLike.count(new services.SparseArray());

        const expected = [0, 0, 0, 0, 0, 0, 0];
        const actual = [zero1, zero2, zero3, zero4, zero5, zero6, zero7];
        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }

        const three1 = services.ArrayLike.count([1, 2, "hello"]);
        const encoded = {
            "dot:encoding": "SparseArray",
            "dot:encoded": [3, "hello"],
        };
        const three2 = services.ArrayLike.count(encoded);
        const three3 = services.ArrayLike.count(new services.SparseArray(encoded));

        if (three1 !== 3 || three2 !== 3 || three3 !== 3) {
            throw new Error("Unexpexted counts: " + [three1, three2, three3]);
        }
    });

    it ('iterates', () => {
        const zero1 = toArray();
        const zero2 = toArray(null);
        const zero3 = toArray("");
        const zero4 = toArray([]);
        const zero5 = toArray({"dot:encoding": "SparseArray"});
        const zero6 = toArray({"dot:encoding": "SparseArray", "dot:encoded": []});
        const zero7 = toArray(new services.SparseArray());

        const expected = [[], [], [], [], [], [], []];
        const actual = [zero1, zero2, zero3, zero4, zero5, zero6, zero7];
        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }

        const three1 = JSON.stringify(toArray(["hello", "hello", "hello"]));
        const encoded = {
            "dot:encoding": "SparseArray",
            "dot:encoded": [3, "hello"],
        };
        const three2 = JSON.stringify(toArray(encoded));
        const three3 = JSON.stringify(toArray(new services.SparseArray(encoded)));

        const exp = JSON.stringify(["hello", "hello", "hello"]);
        if (three1 !== exp || three2 !== exp || three3 !== exp) {
            throw new Error("Unexpexted counts: " + [three1, three2, three3]);
        }
        
        function toArray(json) {
            const r = [];
            services.ArrayLike.forEach(json, (elt, index) => (r[index] = elt));
            return r;
        }
    });
});
