// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateTimer} from '../client/timer.js';

describe('Timer tests', () => {
    const Timer = CreateTimer({});
    
    it ('fires a deferred timer', done => {
        const t = new Timer(done);
        t.defer(0);
    });

    it ('fires a deferred timer only once', done => {
        let err = null;
        const cb = () => {
            done(err);
            err = "Already fired once before";
        };
        const t = new Timer(cb);
        t.defer(100);
        t.defer(10);
        t.defer(0);
    });

    it ('does not fire after a reset', done => {
        const t = new Timer(() => done("should not have fired"));

        t.defer(100);
        t.defer(10);
        t.defer(0);
        t.reset();
        done();
    });
});
