// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateNull} from '../lib/null.js';
import {CreateArrayLike} from '../lib/array_like.js';

describe('Null tests', () => {
    const services = {};
    services.ArrayLike = CreateArrayLike(services);
    services.Null = CreateNull(services);

    it ('basics', () => {
        const n = new services.Null();
        const converted = JSON.stringify({'hello': n});
        if (converted !== "{}") {
            throw new Error("Null converts unpexected to: " + converted);
        }

        if (n.count() !== 0) {
            throw new Error("Null count = " + n.count());
        }

        if (n.slice(0, 0) !== n) {
            throw new Error("Null slice returns something else");
        }

        const cb = () => { throw new Error("Unexpected"); };
        if (n.rangeApply(0, 0, cb) !== n) {
            throw new Error("Null range apply unexpected returns something else");
        }
    });

    it ('throws for invalid params', () => {
        const n = new services.Null();

        shouldThrow('invalid slice start', () => n.slice(5,5));
        shouldThrow('invalid slice end', () => n.slice(0, -1));
        shouldThrow('invalid rangeApply start', () => n.slice(5, 5, noop));
        shouldThrow('invalid rangeApply count', () => n.slice(0, 1, noop));
        shouldThrow('invalid rangeApply count2', () => n.slice(0, -1, noop));
        shouldThrow('invalid splice offset', () => n.splice(5, "", ""));
        shouldThrow('invalid splice before', () => n.splice(0, "hello", ""));
        
        function noop(){}
        function shouldThrow(msg, cb) {
            try {
                cb();
            } catch (e) {
                return;
            }
            throw new Error("expected to throw but didnt: " + msg);
        }
    });

    it ('splices', () => {
        const n = new services.Null();
        const afters = [null, "hello", [1]];
        const befores = [null, "", [], JSON.stringify(n)];

        for (let kk = 0; kk < befores.length; kk ++) {
            for (let jj = 0; jj < afters.length; jj ++) {
                if (n.splice(0, befores[kk], afters[jj]) !== afters[jj]) {
                    throw new Error("splice before/after failed: " + [befores[kk], afters[jj]]);
                }
            }
        }
    });
});
