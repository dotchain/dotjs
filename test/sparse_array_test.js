// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateSparseArray} from '../client/model/sparse_array.js';
import {CreateModelArray} from '../client/model/array.js';

describe('SparseArray tests', () => {
    const services = {};
    services.SparseArray = CreateSparseArray(services);
    services.ModelArray = CreateModelArray(services);

    function make(elts) {
        return {"dot:encoding": "SparseArray", "dot:encoded": elts};
    }

    function toArray(sparse) {
        const r = [];
        sparse.forEach((elt, index) => (r[index] = elt));
        return r;
    }

    function shouldThrow(message, fn) {
        try {
            fn();
        } catch (_) {
            return
        }
        throw new Error(message);
    }
    
    it ('converts properly to JSON', () => {
        const zero1 = new services.SparseArray({"dot:encoding": "SparseArray"});
        const zero2 = new services.SparseArray(make([]));
        const zero3 = new services.SparseArray();

        const expected = [make([]), make([]), make([])];
        const actual = [zero1, zero2, zero3];
        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }

        const raw = make([2, 1, 1, "hello"]);
        const sparse = new services.SparseArray(raw);
        if (JSON.stringify(sparse) !== JSON.stringify(raw)) {
            throw new Error("Mismatched: " + JSON.stringify(sparse));
        }

        const raw2 = make([2, 1]);
        const actual2 = sparse.slice(0, 2)
        if (JSON.stringify(actual2) !== JSON.stringify(raw2)) {
            throw new Error("Mismatched: " + JSON.stringify(actual2));
        }
    });

    it ('creates slices', () => {
        const input = new services.SparseArray(make([2, 1, 3, "hello"]));
        let actual = input.slice(1, 3);
        let expected = new services.SparseArray(make([1, 1, 2, "hello"]));

        if (JSON.stringify(expected) != JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }

        actual = input.slice(0, 3);
        expected = new services.SparseArray(make([2, 1, 1, "hello"]));

        if (JSON.stringify(expected) != JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }

        actual = input.slice(2, 0);
        expected = new services.SparseArray(make([]));

        if (JSON.stringify(expected) != JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }

        actual = input.slice(2, 3);
        expected = new services.SparseArray(make([3, "hello"]));
        
        if (JSON.stringify(expected) != JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }
    });

    it ('splices - deletes', () => {
        const input = new services.SparseArray(make([2, 1, 4, "hello"]));
        const left = input.slice(0, 3), right = input.slice(3, 3);
        const altLeft = input.splice(3, right), altRight = input.splice(0, left);

        if (JSON.stringify(left) != JSON.stringify(altLeft)) {
            throw new Error("Mismatched: " + JSON.stringify(altLeft));
        }

        if (JSON.stringify(right) != JSON.stringify(altRight)) {
            throw new Error("Mismatched: " + JSON.stringify(altRight));
        }


        const empty = left.splice(0, [1, 1, "hello"]);
        if (JSON.stringify(empty) !== JSON.stringify(new services.SparseArray())) {
            throw new Error("Mismatched; " + JSON.stringify(empty));
        }
    });

    it ('splices - inserts', () => {
        const input = new services.SparseArray(make([2, 1, 4, "hello"]));
        const left = input.slice(0, 3), right = input.slice(3, 3);

        const alt1 = left.splice(3, null, right);
        const alt2 = right.splice(0, [], [1, 1, "hello"]);

        if (JSON.stringify(alt1) !== JSON.stringify(input)) {
            throw new Error("Mismatched: " + JSON.stringify(alt1));
        }

        if (JSON.stringify(alt2) !== JSON.stringify(input)) {
            throw new Error("Mismatched: " + JSON.stringify(alt2));
        }        
    });

    it ('splices - replace', () => {
        const input = new services.SparseArray(make([2, 1, 4, "hello"]));
        const replaced = input.splice(2, ["hello"], [1]);
        const expected = new services.SparseArray(make([3, 1, 3, "hello"]));

        if (JSON.stringify(replaced) != JSON.stringify(expected)) {
            throw new Error("Mismatched: " + JSON.stringify(replaced));
        }
    });

    it ('range applies', () => {
        const input = new services.SparseArray(make([2, 1, 4, "hello"]));
        const replaced = input.rangeApply(2, 1, () => 1);
        const expected = new services.SparseArray(make([3, 1, 3, "hello"]));

        if (JSON.stringify(replaced) != JSON.stringify(expected)) {
            throw new Error("Mismatched: " + JSON.stringify(replaced));
        }
    });

    it ('invalid slices', () => {
        const input = new services.SparseArray(make([2, 1]));
        
        shouldThrow("negative offset", () => input.slice(-1, 0));
        shouldThrow("negative index", () => input.slice(0, -1));
        shouldThrow("overflow count", () => input.slice(1, 2));
        shouldThrow("overflow offset", () => input.slice(3, 0));        
    });

    it ('invalid splices', () => {
        const input = new services.SparseArray(make([2, 1]));
        
        shouldThrow("negative offset", () => input.splice(-1, null, null));
        shouldThrow("overflow count", () => input.splice(1, [1, 2, 3, 4], null));
        shouldThrow("overflow offset", () => input.splice(3, null, null));        
    });
    
    it ('counts arrays and array-like objects', () => {
        const zero1 = new services.SparseArray({"dot:encoding": "SparseArray"}).count();
        const zero2 = new services.SparseArray({"dot:encoding": "SparseArray", "dot:encoded": []}).count();
        const zero3 = new services.SparseArray().count();

        const expected = [0, 0, 0];
        const actual = [zero1, zero2, zero3];
        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }

        const encoded = {
            "dot:encoding": "SparseArray",
            "dot:encoded": [3, "hello"],
        };
        const three = new services.SparseArray(encoded).count();

        if (three !== 3) {
            throw new Error("Unexpected counts: " + three);
        }
    });

    it ('iterates', () => {
        const zero = toArray(new services.SparseArray());
        const encoded = {
            "dot:encoding": "SparseArray",
            "dot:encoded": [3, "hello"],
        };
        const three = toArray(new services.SparseArray(encoded));

        const expected = [[], ["hello", "hello", "hello"]];
        const actual = [zero, three];

        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            throw new Error("Mismatched: " + JSON.stringify(actual));
        }
    });
});
