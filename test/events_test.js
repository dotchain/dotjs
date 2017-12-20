// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';


import {CreateEvents} from '../client/model/events.js';

describe('Events tests', () => {
    const Events = CreateEvents();

    it ('subscribes and fires event', done => {
        const t = new Events();
        t.on("my", (event, arg) => {
            done(event == "my" && arg == 42 ? null : new Error("Unknown event arg"));
        });
        t.emit("my", 42);
    });

    it ('fires events in the correct order', done => {
        const t = new Events();
        let count = 0;
        
        t.on("my", (event, arg) => {
            if (count !== 0) done(new Error("Unexpected count: " + count));
            if (event != "my" || arg != 42) done(new Error("Invalid args"));
            count = 1;
        });
        t.on("my", (event, arg) => {
            if (count !== 1) done(new Error("Unexpected count: " + count));
            if (event != "my" || arg != 42) done(new Error("Invalid args"));
            done();
        });
        
        t.emit("my", 42);
    });

    it ('removes events', done => {
        const t = new Events();
        let count = 0;
        
        t.on("my", (event, arg) => {
            if (count !== 0) done(new Error("Unexpected count: " + count));
            if (event != "my" || arg != 42) done(new Error("Invalid args"));
            count = 1;
        });
        const rem = t.on("my", () => done(new Error("Unexpeted callback")));
        t.on("my", (event, arg) => {
            if (count !== 1) done(new Error("Unexpected count: " + count));
            if (event != "my" || arg != 42) done(new Error("Invalid args"));
            done();
        });

        rem();
        t.emit("my", 42);
    });
});


