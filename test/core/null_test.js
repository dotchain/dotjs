// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {expect} from 'chai'

import {Null, Atomic, Replace, decodeValue} from '../..'

describe("Null", () => {
    it("should ignore empty changes", () => {
        let n = new Null()
        expect(n.apply()).to.equal(n)
    })

    it("should succeed with simple replace", () => {
        const repl = new Replace(new Null(), new Atomic(5))
        const before = new Null()
        expect(before.apply(repl)).to.equal(repl.after)
    })
})

describe("Null - interop serialization", () => {
    it("should serialize", () => {
        expect(JSON.stringify(new Null)).to.equal("[]")
    })

    it("should deserialize", () => {
        expect(decodeValue(null, {"changes.empty": []})).to.instanceOf(Null)
    })
})

