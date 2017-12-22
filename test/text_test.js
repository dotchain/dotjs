// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateEvents} from '../lib/events.js';
import {CreateModelText} from '../client/model/text.js';

describe('ModelText tests', () => {
    const ModelText = CreateModelText({Events: CreateEvents()});

    it('empty + splice-insert', done => {
        const m = new ModelText();
        if (m.value() != "") {
            return done(new Error("empty is not empty"));
        }

        let expected = null;
        m.events.on("localChange", (e, d) => {
            if (e != "localChange") {
                return done(new Error("unexpected event: " + e));
            }
            if (d.before != m) {
                return done(new Error("invalid before: " + d.before.value()));
            }
            const change = JSON.stringify(d.change);
            const exp = JSON.stringify({Splice: {Offset: 0, Before: "", After: "hello"}});
            if (exp !== change) {
                return done(new Error("unexpected change: " + JSON.stringify({expected, change})));
            }
            if (d.after.value() != "hello") {
                return done(new Error("unexpected value: " + d.after.value()));
            }            
            expected = d.after;
        });
        const actual = m.splice(0, 0, "hello");
        if (actual !== expected) {
            return done(new Error("Updated does not match: " + JSON.stringify({expected, actual})));
        }
        done();
    });

    it('non-empty + splice-insert-remove', done => {
        let m = new ModelText("hello world");
        if (m.value() != "hello world") {
            return done(new Error("initialization failure: " + m.value()));
        }

        const change1 = {Splice: {Offset: 5, Before: " world"}};
        const change2 = {Splice: {Offset: 5, After: " yo!"}};
        const expected1 = "hello", expected2 = "hello yo!";
        
        m.events.on("localChange", (e, d) => {
            if (e != "localChange") {
                return done(new Error("unexpected event: " + e));
            }
            if (d.before != m) {
                return done(new Error("invalid before: " + d.before.value()));
            }
            const change = JSON.stringify(d.change);
            if (change != JSON.stringify(change1) && change != JSON.stringify(change2)) {
                return done(new Error("unexpected change: " + change));
            }
            if (d.after.value() != expected1 && d.after.value() != expected2) {
                return done(new Error("unexpected value: " + d.after.value()));
            }            
            m = d.after;
        });
        const actual = m.apply('localChange', 0, change1).apply('localChange', 0, change2);
        if (actual !== m) {
            return done(new Error("Updated does not match: " + JSON.stringify({expected:m, actual})));
        }
        done();
    });

    it('non-empty + splice-replace', done => {
        let m = new ModelText("hello world");
        if (m.value() != "hello world") {
            return done(new Error("initialization failure: " + m.value()));
        }

        const change = {Splice: {Offset: 5, Before: " world", After: " yo!"}};
        const expected = "hello yo!";
        
        m.events.on("localChange", (e, d) => {
            if (e != "localChange") {
                return done(new Error("unexpected event: " + e));
            }
            if (d.before != m) {
                return done(new Error("invalid before: " + d.before.value()));
            }
            if (JSON.stringify(change) != JSON.stringify(d.change)) {
                return done(new Error("unexpected change: " + JSON.stringify(d.change)));
            }
            if (d.after.value() != expected) { 
                return done(new Error("unexpected value: " + d.after.value()));
            }            
            m = d.after;
        });

        const actual = m.apply('localChange', 0, change);
        if (actual !== m) {
            return done(new Error("Updated does not match: " + JSON.stringify({expected:m, actual})));
        }
        done();
    });

    it('moves', done => {
        let m = new ModelText("hello world");
        if (m.value() != "hello world") {
            return done(new Error("initialization failure: " + m.value()));
        }

        const result = m.move(5, 1, -5).move(0, 6, 5);
        if (result.value() != "world hello") {
            return done(new Error("Unexpected move result: " + result.value()));
        }
        done();
    });

    it('applies remoteChanges silently', done => {
        const m = new ModelText("hello world")

        m.events.on("localChange", () => done(new Error("Unexpected callback")));

        const changes = [{Path: ['hello'], Splice: {Offset: 6, After: "beautiful "}}];
        const result = m.apply('remoteChange', 1, changes);
        if (result.value() != "hello beautiful world") {
            done(new Error("Unexpected result: " + result.value()));
        }
        done();
    });

    it('throws when attempting to apply a change with a path', done => {
        const m = new ModelText("hello world")
        try {
            m.apply('localChange', 0, {Path: ["hello"], Splice: {Offset: 0, After: "x"}})
        } catch (e) {
            return done(null);
        }
        done(new Error("successfully applied invalid change"));
    });

    it('throws when attempting to apply a set', done => {
        const m = new ModelText("hello world")
        try {
            m.apply('localChange', 0, {Set: {}});
        } catch (e) {
            return done(null);
        }
        done(new Error("successfully applied invalid change"));
    });

    it('throws when attempting to apply a range', done => {
        const m = new ModelText("hello world")
        try {
            m.apply('localChange', 0, {Range: {}});
        } catch (e) {
            return done(null);
        }
        done(new Error("successfully applied invalid change"));
    });
});
