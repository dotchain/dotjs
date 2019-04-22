// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {expect} from 'chai'

import {Null, Atomic, Replace} from '../..'

describe("Replace - interop serialization", () => {
    it("should serialize", () => {
        const replace = new Replace(new Null(), new Atomic(new Null()))
        expect(JSON.stringify(replace)).to
            .equal('[{"changes.empty":[]},{"changes.Atomic":[{"changes.empty":[]}]}]')
    })

    it("should desserialize", () => {
        const replace = new Replace(new Null(), new Atomic(new Null()))
        const json = JSON.parse(JSON.stringify(replace))
        expect(Replace.fromJSON(null, json)).to.deep.equal(replace)
    })
})

