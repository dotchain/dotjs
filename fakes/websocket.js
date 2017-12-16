// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

const subscriptions = {};

// eslint-disable-next-line no-undef
afterEach(() => {
    for (var key in subscriptions) {
        delete subscriptions[key];
    }
});

export class NativeWebSocket {
    static register(url, callbacks) {
        if (!callbacks) {
            delete subscriptions[url];
        } else {
            subscriptions[url] = callbacks;
        }
    }

    constructor(url, protocols) {
        this._url = url;
        this._protocols = protocols;
        this._closedCount = 0;
        this._sent = [];
        
        this.binaryType = "not modified";
        this.protocol = "not specified";
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;

        if (subscriptions[url] && subscriptions[url].ctor) {
            subscriptions[url].ctor(this, url, protocols);
        }
    }

    close() {
        this._closedCount ++;
        if (subscriptions[this._url] && subscriptions[this._url].close) {
            subscriptions[this._url].close(this);
        }
    }

    send(data) {
        this._sent.push(data);
        if (subscriptions[this._url] && subscriptions[this._url].send) {
            subscriptions[this._url].send(this, data);
        }
    }

    testGetInfo() {
        return {
            url: this._url,
            protocols: this._protocols,
            closedCount: this._closedCount,
            sent: this._sent
        }
    }
}
