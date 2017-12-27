// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateLog} from '../lib/log.js';

describe('Log tests', () => {
    it('does not crash', () => {
        const Log = CreateLog();
        const log = new Log("hello: ");
        log.log("log", 22);
        log.warn("warn", 22);
        log.error("error", 22);
        log.fatal("fatal", 22);
    });
})
