// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateSyncTransport is a builder for the SyncTransport service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateSyncTransport(services) {
    // ConnectionManager implements the core interface that multiplexes
    // a set of SyncBridge objects to a single connection, handling
    // connection breaks and reconnects.
    class ConnectionManager {
        constructor(url) {
            this._log = new services.Log("transport: ");
            this._url = url;
            this._conn = new services.Connection(url, this);
            
            // map subID => SyncBridge, not yet initiialized
            this._pending = {};

            // map subID => {bridge, cleanup}
            this._attached = {};
        }

        initialize(bridge) {
            const subID = (new services.UUID()).toString();
            this._pending[subID] = bridge;
            bridge.startInitializing();
            this._subscribe(subID, bridge);
            return subID;
        }

        _subscribe(subID, bridge) {
            bridge.rollUpChanges();
            this._conn.subscribe(subID, bridge.id, bridge.ops);
        }

        _resubscribe(subID, bridge) {
            bridge.rollUpChanges();
            const r = {BasisID: bridge.basisID, ParentID: bridge.parentID};
            this._conn.reconnect(subID, bridge.id, bridge.ops, r);
        }
             
        attach(bridge) {
            const subID = (new services.UUID()).toString();
            this._attach(subID, bridge);
            this._resubscribe(subID);
            return subID;
        }

        _attach(subID, bridge) {
            const flush = () => this._flush(subID);
            const cleanup = bridge.events.on('localChangeFlush', flush);
            this._attached[subID] = {bridge, cleanup};
        }

        detach(subID) {
            delete(this._pending[subID]);
            if (this._attached[subID]) {
                this._attached[subID].cleanup();
                delete(this._attached[subID]);
            }
        }

        onConnected() {
            for (let subID in this._pending) {
                this._subscribe(subID, this._pending[subID]);
            }
            for (let subID in this._attached) {
                this._resubscribe(subID, this._attached[subID].bridge);
           }
        }

        onDisconnected() {
        }

        onErrorResponse(subID, err) {
            this._log.fatal("Unexpected server error", err);
        }
        
        onBootstrap(subID, rebased, clientRebased) {
            const bridge = this._pending[subID];
            if (!bridge) return;
            delete(this._pending[subID]);
            bridge.finishInitializing(rebased, clientRebased);
            this._attach(subID, bridge);
        }

        onNotificationResponse(subID, ops, ackID) {
            const {bridge} = this._attached[subID] || {};
            if (!bridge) return;
            bridge.applyServerOperations(ops);
            bridge.clearAcknowledgements(ackID);
        }

        _flush(subID) {
            const {bridge} = this._attached[subID];
            bridge.rollUpChanges()
            const ops = bridge.ops;
            this._conn.append(subID, ops.slice(-1));
        }
    }
    
    // SyncTransport manages mulitple manaconnections using a connection
    // bridge for each. It uses the mapper services to map modelIDs
    // to URLs
    return class SyncTransport {
        constructor() {
            this.events = new services.Events();
            this._log = new services.Log("transport: ");

            // url => ConnectionManager
            this._conns = {};
            // bridge => subID
            this._subs = new Map();
        }

        initialize(bridge) {
            const url = services.ModelUrlMapper.fromModelID(bridge.id)
            this._conns[url] = this._conns[url] || new ConnectionManager(url);
            const subID = this._conns[url].initialize(bridge);
            this._subs[bridge] = {subID, url};
        }

        attach(bridge) {
            const url = services.ModelUrlMapper.fromModelID(bridge.id)
            this._conns[url] = this._conns[url] || new ConnectionManager(url);
            const subID = this._conns[url].attach(bridge);
            this._subs[bridge] = {subID, url};
        }
        
        detach(bridge) {
            if (!this._subs[bridge]) return;
            const {subID, url} = this._subs[bridge];
            delete(this._subs[bridge]);
            this._conns[url].detach(subID);
        }
    }
}

