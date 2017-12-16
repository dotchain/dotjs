// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateWebSocket} from '../client/websocket.js';
import {CreateLog} from '../fakes/log.js';
import {NativeWebSocket} from '../fakes/websocket.js';
import {Inflator, Deflator} from '../fakes/pako.js';

describe('Websocket tests', () => {
    const servicesWithoutCompression = {
        NativeWebSocket: NativeWebSocket,
        Log: CreateLog(),
    };

    const servicesWithCompression = {
        NativeWebSocket: NativeWebSocket,
        Log: CreateLog(),
        Inflator: Inflator,
        Deflator: Deflator,
    };

    describe("Without compression", () => suite(servicesWithoutCompression));
    describe("With compression", () => suite(servicesWithCompression));
});

function suite(services) {
    function strtoab(str) {
        const ab = new ArrayBuffer(str.length);
        const buf = new Uint8Array(ab);
        for (let kk = 0; kk < str.length; kk ++) {
            buf[kk] = str.charCodeAt(kk);
        }
        return ab;
    }
    
    afterEach(() => {
        services.Log.clear();
    });
    
    it('does not crash', done => {
        const WebSocket = CreateWebSocket(services);
        let url, protos;
        
        NativeWebSocket.register("myurl", {
            ctor(ws, xurl, xprotos) { url = xurl; protos = xprotos; }
        });
                                 
        new WebSocket("myurl", ["dot", "dotz"], null, null, null, null);

        if (url != "myurl") {
            return done(new Error("Bad constructor call?: " + url));
        }

        if (!protos || !url || protos[0] != "dot") {
            return done(new Error("Bad constructor call?: " + JSON.stringify({protos, url})));
        }

        const noPako = !services.Inflator || !services.Deflator;

        if (noPako && protos.length != 1 || !noPako && protos[1] != "dotz") {
            return done(new Error("Bad constructor call?: " + JSON.stringify(protos)));
        }

        done();
    });

    it('reports errors bofore open', done => {
        const WebSocket = CreateWebSocket(services);
        let ws, err;
        
        NativeWebSocket.register("myurl", {
            ctor(s) { ws = s; }
        });

        const onError = e => err = e;
        new WebSocket("myurl", ["dot", "dotz"], null, null, onError, null);
        const expected = new Error("expeceted error");
        ws.onerror(expected);
        if (err != expected) {
            done("did not get the expected error");
        }
        
        done();
    });

    it('reports errors after open', done => {
        const WebSocket = CreateWebSocket(services);
        let ws, err;
        
        NativeWebSocket.register("myurl", {
            ctor(s) { ws = s; }
        });

        const onError = e => err = e;
        const onOpen = () => null;
        new WebSocket("myurl", ["dot", "dotz"], onOpen, null, onError, null);
        const expected = new Error("expeceted error");
        ws.onopen();
        ws.onerror(expected);
        if (err != expected) {
            return done("did not get the expected error");
        }
        done();
    });

    it('reports messages up', done => {
        const WebSocket = CreateWebSocket(services);
        let ws, data;
        
        NativeWebSocket.register("myurl", {
            ctor(s) { ws = s; }
        });

        const onOpen = () => null;
        const onMessage = msg => data = msg;
        const onError = e => { throw e; };
        new WebSocket("myurl", ["dot", "dotz"], onOpen, onMessage, onError, null);
        const expected = "expected data";
        ws.onopen();
        ws.onmessage({data: services.Inflator ? strtoab(expected) : expected});

        if (data !== expected) {
            return done(new Error("did not get the expected data:" + JSON.stringify({data, expected})));
        }
        
        done();
    });

    it('reports inflate errors messages up', done => {
        if (!services.Inflator) return done();
        
        const WebSocket = CreateWebSocket(services);
        let ws;
        
        NativeWebSocket.register("myurl", {
            ctor(s) { ws = s; }
        });

        let err, expectedError = new Error("some error");
        
        const onOpen = () => null;
        const onMessage = () => { throw new Error("msg"); };
        const onError = e => { err = e; };
        new WebSocket("myurl", ["dot", "dotz"], onOpen, onMessage, onError, null);
        ws.onopen();
        services.Inflator.setNextError(expectedError);
        ws.onmessage({data: strtoab("ok")});

        if (err !== expectedError) {
            return done(new Error("did not get the expected error: " + err));
        }
        
        done();
    });
    
    it('sends messages down', done => {
        const WebSocket = CreateWebSocket(services);
        let ws;
        
        NativeWebSocket.register("myurl", {
            ctor(s) { ws = s; }
        });

        const onOpen = () => null;
        const onMessage = msg => { throw msg; };
        const onError = e => { throw e; };
        const sock = new WebSocket("myurl", ["dot", "dotz"], onOpen, onMessage, onError, null);
        const expected = "expected data";
        let actual;
        
        ws.onopen();

        if (services.Deflator) {
            ws.protocol = "dotz";
            sock.send(expected);
            actual = String.fromCharCode.apply(null, ws.testGetInfo().sent[0]);
        } else {
            sock.send(expected);
            actual = ws.testGetInfo().sent[0]
        }

        if (actual !== expected) {
            const err = "mismatched: " + JSON.stringify({expected, actual});
            return done(new Error(err));
        }
        
        done();
    });
    
    it('closes connn on deflator errors', done => {
        if (!services.Deflator) return done();
        
        const WebSocket = CreateWebSocket(services);
        let ws, closed;
        
        NativeWebSocket.register("myurl", {
            ctor(s) { ws = s; },
            close() { closed = true; }
        });

        const onOpen = () => null;
        const onMessage = msg => { throw msg; };
        const onError = e => { throw e; };
        const sock = new WebSocket("myurl", ["dot", "dotz"], onOpen, onMessage, onError, null);

        ws.onopen();
        ws.protocol = "dotz";
        Deflator.setNextError(new Error("some error"));
        sock.send("something");

        done(closed ? null : new Error("did not close on error"));
    });
}
