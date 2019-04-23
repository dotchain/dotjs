// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {expect} from 'chai'

import {Null, Atomic, PathChange, Replace} from '../..'
import {FakeDecoder} from './decoder_test.js';

describe("PathChange", () => {
    it("reverts", () => {
        const path = [1, "hello"]
        const replace = new Replace(new Null(), new Atomic(new Null()));
        const expected = new Replace(replace.after, replace.before);
        expect(new PathChange(path, replace).revert())
            .to.deep.equal(new PathChange(path, expected));
    });
})

describe("PathChange - interop serialization", () => {
    it("should serialize", () => {
        expect(JSON.stringify(new PathChange))
            .to.equal('[null,null]');

        const replace = new Replace(new Null(), new Null());
        expect(JSON.stringify(new PathChange(null, replace)))
            .to.equal('[null,{"changes.Replace":[{"changes.empty":[]},{"changes.empty":[]}]}]');
    });

    it("should desserialize", () => {
        const d = new FakeDecoder;
        expect(PathChange.fromJSON(d, [null, null]))
            .to.deep.equal(new PathChange);

        const replace = new Replace(new Null(), new Null());
        expect(PathChange.fromJSON(d, [null,{"changes.Replace":[{"changes.empty":[]},{"changes.empty":[]}]}]))
            .to.deep.equal(new PathChange(null, replace));
    });

});

