// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateConnection is a builder for the Connection service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateConnection(services) {
    // Connection implements a reliable connection to a Log or Journal
    // service using WebSockets.
    return class Connection {
        constructor(url, parent) {
            this._log = new services.Log("connection: ");
            this._parent = parent;
            this._ws = null;

            const fn = () =>  this._connect(url);
            this._retry = new services.Retry(fn);
            fn();
        }

        _connect(url) {
            const protos = ["dotl", "dotlz"];
            const o = () => this._onOpen();
            const m = msg => this._onMessage(msg);
            const e = err => this._onError(err);
            const c = () => this._onClose();
            this._ws = new services.WebSocket(url, protos, o, m, e, c);
        }

        _onOpen() {
            this._retry.reset();
            this._parent.onConnected();
        }

        _onMessage(msg) {
            const m = JSON.parse(msg);
            const ops = m.Ops || [];
            const ackID = m.AckID || "";
            const message = m.Message || "";
            
            if (message !== "") {
                this._log.warn("server reported error", m.ModelID, message);
                this._parent.onErrorResponse(m.ModelID, message);
            } else if (ops.length > 0 || ackID !== "") {
                this._log.log("Received", m.ModelID, ops, ackID);
                this._parent.onNotificationResponse(m.ModelID, ops, ackID);
            } else {
                const rebased = m.Rebased || [];
                const clientRebased = m.ClientRebased || [];
                this._log.log("Subscribed", m.ModelID, rebased, clientRebased);
                this._parent.onBootstrap(m.ModelID, rebased, clientRebased);
            }
        }

        _onError(err) {
            this._log.warn("lost will retry later, error: ", err);
            this._ws = null;
            this._parent.onDisconnected();
            this._retry.retry();
        }

        _onClose() {
            if (this._ws != null) {
                this._log.warn("closed.  will retry later");
                this._ws = null;
                this._parent.onDisconnected();
                this._retry.retry();
            }
        }
        
        subscribe(modelID, ops, lastID) {
            this._log.log("subscribing to", modelID);
            const m = {Subscribe: modelID};
            if (ops && ops.length > 0) m.ClientOps = ops;
            if (lastID) m.LastID = lastID;
            this._send(m);
        }

        unsubscribe(modelID) {
            this._log.log("unsubscribing from", modelID);
            this._send({Unsubscribe: modelID});
        }

        append(modelID, ops) {
            this._log.log("sending ops to", modelID, ops);
            this._send({Append: modelID, Ops: ops})
        }

        _send(msg) {
            if (this._ws != null) {
                this._ws.send(JSON.stringify(msg));
            }
        }
    }
}
