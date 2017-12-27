// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateRandom} from '../lib/random.js';

describe('Random tests', () => {
    it('creates a random number', done => {
        const Random = CreateRandom();
        const r = Random.number(42);

        done((r >= 0 && r <= 42) ? null : new Error("Unexpected random number: " + r.toString()));
    });
})
