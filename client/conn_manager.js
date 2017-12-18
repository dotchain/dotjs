// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateConnectionManager is a builder for the ConnectionManager service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateConnectionManager(services) {
    // ConectionManager manages the multiplexing of a single websocket
    // connection onto multiple model subscriptions.
    return class ConnectionManager {
        // url is the websocket url that manages a bunch of modelIDs.
        // modelManagers is the hash of subID => ModelManager
        // maintained by the client
        constructor(url, modelManagers) {
            this._log = new services.Log("conn_mgr: ");
            this._managers = modelManagers;

            // subs is a map of subID => modelID to indicate the
            // set of subscriptions maintained on this connection
            this._subs = {};

            this._isConnected = false;
            this._conn = new services.Connection(url, this);
        }

        onConnected() {
            this._isConnected = true;
            for (let id in this._subs) {
                this._managers[id].onConnected(this._conn);
            }
        }

        onDisconnected() {
            this._isConnected = false;
            for (let id in this._subs) {
                this._managers[id].onDisconnected(this._conn);
            }
        }

        onErrorResponse(subID, errMessage) {
            this._log.warn("Error NYI", subID, errMessage);
        }

        onNotificationResponse(id, ops, ackID) {
            if (!this._subs[id]) return;
            this._managers[id].onNotificationResponse(ops, ackID);
        }

        onBootstrap(id, rebased, clientRebased) {
            if (!this._subs[id]) return;
            this._managers[id].onBootstrap(rebased, clientRebased);
        }

        add(subID, modelID) {
            this._subs[subID] = modelID;
            if (this._connected) {
                this._managers[subID].onConnected(this._conn);
            }
        }

        remove(subID) {
            this._conn.unsubscribe(subID);
            delete this._subs[subID];
        }
    }
}
