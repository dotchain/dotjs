// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateTimer returns a FakeTimer class which implements the
// same semantics as a regular timer except it does not use the
// real time as much.
export function CreateTimer() {
    let timers = [];
    let count = 0;
    let timeOffset = 0;
    let getTimeFn = () => timeOffset + Date.now();
    let firing = false;
    
    function add(fn, interval) {
        const result = {fn: fn, expiration: getTimeFn() + interval, deleted: false, count: count};
        count ++;
        timers.push(result);
        return result;
    }

    function clear(result) {
        if (!result) return;
        result.deleted = true;
        for (let kk = 0; kk < timers.length; kk ++) {
            if (timers[kk] == result) {
                timers.splice(kk, 1);
                return;
            }
        }
    }

    function compare(r1, r2) {
        if (r1.expiration === r2.expiration) return r1.count - r2.count;
        return r1.expiration - r2.expiration;
    }

    function fire() {
        if (firing) {
            throw new Error("Nested fireExpiredEvents can lead to unpredictable tests");
        }
        
        firing = true;
        const n = getTimeFn();

        const fired = [];
        for (let kk = 0; kk < timers.length; kk ++) {
            if (timers[kk].expiration > n) continue;
            fired.push(timers[kk]);
            timers.splice(kk, 1);
            kk --;
        }
        
        fired.sort(compare);
        for (let kk = 0; kk < fired.length; kk ++) {
            if (!fired[kk].deleted) {
                fired[kk].deleted = true;
                fired[kk].fn();
            }
        }
        firing = false;
    }
    
    return class FakeTimer {
        constructor(fn) {
            this._fn = fn;
            this._t = null;
        }

        now() { return getTimeFn(); }

        defer(interval) {
            clear(this._t);
            this._t = add(this._fn, interval);
        }

        reset() {
            clear(this._t);
            this._t = null;
        }

        static advanceTimeBy(offset) {
            timeOffset += offset;
            return FakeTimer;
        }

        static fireExpiredEvents() {
            fire();
            return FakeTimer;
        }       
    };
}
