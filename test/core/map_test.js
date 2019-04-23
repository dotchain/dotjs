// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {expect} from 'chai'

import {Map, Null, Atomic, Replace, decodeValue} from '../..'
import {FakeDecoder} from './decoder_test.js';

describe("Map", () => {
    it("should ignore empty changes", () => {
	let n = new Map();
	expect(n.apply()).to.equal(n)
    });

    it("should immutably set keys", () => {
        let n = new Map();
        let njson = JSON.stringify(n);
        let n2 = n.set(5, new Atomic(5));
        expect(njson).to.equal(JSON.stringify(n));
        expect(n2.get(5)).to.deep.equal(new Atomic(5));
    });

    it("should immutably delete keys", () => {
        let n = new Map();
        let njson = JSON.stringify(n);
        let n2 = n.set(5, new Atomic(5));
        let n3 = n2.set(5, new Null);
        expect(n3).to.deep.equal(n);
        expect(njson).to.equal(JSON.stringify(n));
        expect(n2.get(5)).to.deep.equal(new Atomic(5));
    });

    it("should succeed with simple replace", () => {
        const before = new Map();
	const repl = new Replace(before, new Atomic(5));
	expect(before.apply(repl)).to.equal(repl.after);
    });
});

describe("Map - interop serialization", () => {
    it("should serialize", () => {
	expect(JSON.stringify(new Map())).to.equal("[]");
        expect(JSON.stringify(new Map([]))).to.equal("[]");
        expect(JSON.stringify(new Map([[2,"q"],["s", "p"]])))
            .to.equal('[{"int":2},{"string":"q"},{"string":"s"},{"string":"p"}]');
    })
    
    it("should deserialize", () => {
        const d = new FakeDecoder;
	expect(decodeValue(null, {"changes/types.M": []})).to.deep.equal(new Map);

        let json = [{"int":2},{"changes.empty":[]},{"string":"s"},{"changes.empty":[]}];
        expect(Map.fromJSON(d, json))
            .to.deep.equal(new Map([[2,new Null],["s", new Null]]));
    });
});

