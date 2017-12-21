// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateSparseArray is a builder for the SparseArray class. 
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateSparseArray(services) {
    const empty = [];
    
    function make(elts) {
        return {"dot:encoding": "SparseArray", "dot:encoded": elts};
    }
    
    // SparseArray 
    return class SparseArray {
        constructor(json) {
            if (json && json["dot:encoding"] !== "SparseArray") {
                throw new Error("Invalid json: " + JSON.stringify(json));
            }
            this._elts = (json || {})["dot:encoded"] || empty;
        }

        toJSON() { return make(this._elts); }
        
        count() {
            let sum = 0;
            for (let kk = 0; kk < this._elts.length; kk += 2) {
                sum += this._elts[kk];
            }
            return sum;
        }

        forEach(fn) {
            let index = 0;
            for (let kk = 0; kk < this._elts.length; kk += 2) {
                for (let jj = 0; jj < this._elts[kk]; jj ++) {
                    fn(this._elts[kk+1], index++)
                }
            }
        }

        _slice(offset, count) {
            if (offset < 0 || count < 0) throw new Error("slice: invalid parameter");
            let index = 0;
            const elts = [];
            for (let kk = 0; kk < this._elts.length; kk += 2) {
                const s = Math.max(index, offset);
                const e = Math.min(index + this._elts[kk], offset + count);
                if (s < e) elts.push(e - s, this._elts[kk+1])
                index += this._elts[kk];
            }
            if (index < offset + count) throw new Error("Invalid slice()");
            return elts;
        }

        slice(offset, count) {
            return new SparseArray(make(this._slice(offset, count)));
        }

        splice(offset, before, after) {
            if (offset < 0 || count < 0) throw new Error("splice: invalid parameter");

            const count = services.ArrayLike.count(before);
            const end = offset + count;
            const e = [];
            const append = elt => {
                if (e.length > 0 && e[e.length-1] === elt) e[e.length-2]++;
                else e.push(1, elt);
            };
            
            let seen = 0;
            this.forEach((elt, ii) => {
                seen ++;
                if (ii === offset) services.ArrayLike.forEach(after, append);
                if (ii < offset || ii >= end) append(elt);
            });

            if (seen < end) throw new Error("splice: invalid params");
            if (seen === end) services.ArrayLike.forEach(after, append);
            return new SparseArray(make(e));
        }

        rangeApply(offset, count, fn) {
            const before = this.slice(offset, count);
            const after = [];
            before.forEach((elt, index) => after[index] = fn(elt));
            return this.splice(offset, before, after);
        }
    }
}
