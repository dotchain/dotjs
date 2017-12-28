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
            
            // map subID => {modelID, path, clientOps, done}
            this._pending = {};

            // map subID => {bridge, cleanup}
            this._attached = {};
        }

        initialize(subID, modelID, path, clientOps, done) {
            this._pending[subID] = {modelID, path, clientOps, done};
            this._conn.subscribe(subID, modelID, clientOps);
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
                const {modelID, path, clientOps} = this._pending[subID];
                this._conn.subscribe(subID, modelID, clientOps);
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
            const pending = this._pending[subID];
            if (!pending) return;
            delete(this._pending[subID]);
            let model = new services.ModelText();
            const ops = [].concat(rebased, clientRebased);
            for (let kk = 0; kk < ops.length; kk ++) {
                if (!ops[kk].Changes) continue;
                for (let jj = 0; jj < ops[kk].Changes.length; jj ++) {
                    model = model.apply('remoteChange', 0, ops[kk].Changes[jj]);
                }
            }
            let basisID = "", parentID = "";
            if (rebased.length > 0) basisID = rebased[rebased.length-1].ID;
            if (pending.clientOps && pending.clientOps.length > 0) {
                parentID = pending.clientOps[pending.clientOps.length-1].ID;
            }
            const bridge = new services.SyncBridge({
                id: pending.modelID,
                path: pending.path,
                model: model,
                basisID: basisID,
                parentID: parentID,
            });
            
            this._attach(subID, bridge);
            pending.done(bridge);
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

    class ModelUrlParser {
        static parse(url) {
            const parts = url.split('#');
            const pathParts = parts[0].split("/");
            const modelID = pathParts[pathParts.length-1];
            const wsUrl = pathParts.slice(0, -1).join('/')
                  .replace(/^https/i, "wss")
                  .replace(/^http/i, "ws");
            return {wsUrl, modelID, path: (parts[1] || "").split("/")};
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

        initialize(url, clientOps, done) {
            const subID = (new services.UUID()).toString();
            const {wsUrl, modelID, path} = ModelUrlParser.parse(url);
            this._conns[wsUrl] = this._conns[wsUrl] || new ConnectionManager(wsUrl);
            this._conns[wsUrl].initialize(subID, modelID, path, clientOps, bridge => {
                this._subs[bridge] = {subID, wsUrl};
                if (done) done(bridge);
            });
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

