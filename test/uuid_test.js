// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateUUID} from '../client/uuid.js';

describe('UUID tests', () => {
    beforeEach(() => {
        global.crypto = {getRandomValues(a) { a[0] = 1; a[1] = 2; }}
    });
    afterEach(() => delete(global, "crypto"))

    it('creates a UUID', done => {
        const UUID = CreateUUID();
        const u = new UUID();
        const str = u.toString();
        
        if (str != "1-2") {
            done(new Error("unexpected UUID: " + str));
        }

        if (JSON.stringify(new UUID()) != JSON.stringify(str)) {
            done(new Error("unexpected UUID stringified: " + JSON.stringify(new UUID())));
        }

        done();
    });
})
