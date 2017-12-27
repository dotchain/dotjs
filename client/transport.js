// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateTransport is a builder for the Transport service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateTransport(services) {
    // ConnectionManager implements the core interface that multiplexes
    // a set of ModelManager objects to a single connection, handling
    // connection breaks and reconnects.
    class ConnectionManager {
        constructor(url) {
            this._log = new services.Log("transport: ");
            this._url = url;
            this._conn = new services.Connection(url, this);
            
            // map subID => ModelManager, not yet initiialized
            this._pending = {};

            // map subID => {manager, cleanup}
            this._attached = {};
        }

        initialize(manager) {
            const subID = (new services.UUID()).toString();
            this._pending[subID] = manager;
            manager.startInitializing();
            this._subscribe(subID, manager);
            return subID;
        }

        _subscribe(subID, manager) {
            manager.rollUpChanges();
            this._conn.subscribe(subID, manager.id, manager.ops);
        }

        _resubscribe(subID, manager) {
            manager.rollUpChanges();
            const r = {BasisID: manager.basisID, ParentID: manager.parentID};
            this._conn.reconnect(subID, manager.id, manager.ops, r);
        }
             
        attach(manager) {
            const subID = (new services.UUID()).toString();
            this._attach(subID, manager);
            this._resubscribe(subID);
            return subID;
        }

        _attach(subID, manager) {
            const flush = () => this._flush(subID);
            const cleanup = manager.events.on('localChangeFlush', flush);
            this._attached[subID] = {manager, cleanup};
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
                this._resubscribe(subID, this._attached[subID].manager);
           }
        }

        onDisconnected() {
        }

        onErrorResponse(subID, err) {
            this._log.fatal("Unexpected server error", err);
        }
        
        onBootstrap(subID, rebased, clientRebased) {
            const manager = this._pending[subID];
            if (!manager) return;
            delete(this._pending[subID]);
            manager.finishInitializing(rebased, clientRebased);
            this._attach(subID, manager);
        }

        onNotificationResponse(subID, ops, ackID) {
            const {manager} = this._attached[subID] || {};
            if (!manager) return;
            manager.applyServerOperations(ops);
            manager.clearAcknowledgements(ackID);
        }

        _flush(subID) {
            const {manager} = this._attached[subID];
            manager.rollUpChanges()
            const ops = manager.ops;
            this._conn.append(subID, ops.slice(-1));
        }
    }
    
    // Transport manages mulitple manaconnections using a connection
    // manager for each. It uses the mapper services to map modelIDs
    // to URLs
    return class Transport {
        constructor() {
            this.events = new services.Events();
            this._log = new services.Log("transport: ");

            // url => ConnectionManager
            this._conns = {};
            // manager => subID
            this._subs = new Map();
        }

        initialize(manager) {
            const url = services.ModelUrlMapper.fromModelID(manager.id)
            this._conns[url] = this._conns[url] || new ConnectionManager(url);
            const subID = this._conns[url].initialize(manager);
            this._subs[manager] = {subID, url};
        }

        attach(manager) {
            const url = services.ModelUrlMapper.fromModelID(manager.id)
            this._conns[url] = this._conns[url] || new ConnectionManager(url);
            const subID = this._conns[url].attach(manager);
            this._subs[manager] = {subID, url};
        }
        
        detach(manager) {
            if (!this._subs[manager]) return;
            const {subID, url} = this._subs[manager];
            delete(this._subs[manager]);
            this._conns[url].detach(subID);
        }
    }
}

