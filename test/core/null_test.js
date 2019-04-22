// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {expect} from 'chai'

import {Null} from '../../core/null.js'
import {Atomic} from '../../core/atomic.js'
import {Replace} from '../../core/replace.js'

describe("null", () => {
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

