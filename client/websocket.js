// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateWebsocket is a builder for the WebSocket service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateWebSocket(services) {
    const Z_SYNC_FLUSH = 2;

    // WebSocketWrapper implements a thin wrapper around the browser
    // websockets API. It also implements the custom compression
    // subprotocol (which is expected to be the second subprotocol
    // provided).
    return class WebSocketWrapper {
        constructor(url, protocols, onOpen, onMessage, onError, onClose) {
            let p = protocols || [];
            this._log = new services.Log("websocket:");
            if (services.Inflator == null || services.Deflator == null) {
                // pretend like there aint no compressed protocol
                p = protocols.slice(0, 1);
            } else {
                this._inflator = new services.Inflator({to: 'string', raw: true});
                this._deflator = new services.Deflator({to: 'string', raw: true});
            }
            
            this._compressedProtocol = p[1];
            this._ws = new services.NativeWebSocket(url, p);
            this._ws.binaryType = "arraybuffer";
            this._ws.onopen = () => onOpen();
            this._ws.onmessage = e => this._onMessage(e.data, onMessage, onError);
            this._ws.onerror = err => this._onError(err, onError);
            this._ws.onclose = () => onClose();
        }
        _onMessage(data, cb, onError) {
            if (data instanceof ArrayBuffer) {
                this._inflator.push(new Uint8Array(data), Z_SYNC_FLUSH);
                const err = this._inflator.err;
                if (err !== 0) {
                    this._ws.close();
                    this._onError(err, onError);
                } else {
                    const result = this._inflator.result;
                    cb(result);
                }
            } else {
                cb(data);
            }
        }
        _onError(err, onError) {
            this._log.warn("error", err);
            onError(err);
        }
        
        send(data) {
            if (this._compressedProtocol && this._ws.protocol === this._compressedProtocol) {
                this._deflator.push(data, Z_SYNC_FLUSH);
                if (this._deflator.err !== 0) {
                    this._ws.close();
                } else {
                    this._ws.send(this._deflator.result);
                }
            } else {
                this._ws.send(data);
            }
        }
    }
}

