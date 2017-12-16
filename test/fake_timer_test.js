// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateTimer} from '../fakes/fake_timer.js';

describe('Timer tests', () => {
    const Timer = CreateTimer({});
    
    it ('fires a deferred timer', done => {
        
        const t = new Timer(done);
        t.defer(0);
        Timer.fireExpiredEvents();
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
        Timer.fireExpiredEvents();
    });

    it ('does not fire after a reset', done => {
        const t = new Timer(() => done("should not have fired"));

        t.defer(100);
        t.defer(10);
        t.defer(0);
        t.reset();
        Timer.fireExpiredEvents();
        done();
    });

    it ('allows firing of future events by advancing', done => {
        let fired = false;
        const should = new Timer(() => done());
        const shouldNot = new Timer(() => {fired = true});

        shouldNot.defer(11*1000);
        should.defer(10*1000);
        Timer.advanceTimeBy(10*1000).fireExpiredEvents();
        if (fired) {
            done("unexpectedly fired the wrong event");
        }
        Timer.advanceTimeBy(1000).fireExpiredEvents();
        if (!fired) {
            done("second timer advance did not fire an error");
        }
    });
});
