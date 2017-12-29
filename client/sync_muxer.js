// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateSyncMuxer is a builder for the SyncMuxer service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateSyncMuxer(services) {
    // SyncMuxer multiplexes a single Connection against a
    // set of SyncBridges.  It deals with connection breaks and
    // reconnects by automatically reconnecting.
    class SyncMuxer {
        constructor(url) {
            this._log = new services.Log("transport: ");
            this._url = url;
            this._conn = new services.Connection(url, this);
            
            // map subID => PendingSubscribe
            this._pending = {};

            // map subID => AttachedBridge
            this._attached = {};
        }

        // subscribe+build a model from scratch for the model url
        initialize(subID, url, clientOps, done) {
            const pending = new PendingSubscribe(subID, url, clientOps, done);
            this._pending[subID] = pending;
            pending.subscribe(this._conn);
        }

        // attach a bridge with an existing model + possible pending changes
        attach(bridge) {
            const subID = (new services.UUID()).toString();
            this._attached[subID] = new AttachedBridge(subID, this._conn, bridge);
            this._attached[subID].reconnect();
            return subID;
        }

        // detach a bridge
        detach(subID) {
            delete(this._pending[subID]);
            if (this._attached[subID]) {
                this._attached[subID].cleanup();
                delete(this._attached[subID]);
            }
        }

        onConnected() {
            for (let subID in this._pending) {
                this._pending[subID].subscribe(this._conn);
            }
            for (let subID in this._attached) {
                this._attached[subID].reconnect();
           }
        }

        onDisconnected() {
            for (let subID in this._attached) {
                this._attached[subID].disconnect();
            }
        }

        onErrorResponse(subID, err) {
            this._log.fatal("Unexpected server error", err);
        }
        
        onBootstrap(subID, rebased, clientRebased) {
            const pending = this._pending[subID];
            if (!pending) return;
            delete(this._pending[subID]);
            const bridge = pending.createBridge(rebased, clientRebased);
            this._attached[subID] = new AttachedBridge(subID, this._conn, bridge);
            this._attached[subID].setupFlusher();
            pending.complete(bridge);
        }

        onNotificationResponse(subID, ops, ackID) {
            if (!this._attached[subID]) return;
            this._attached[subID].handleNotifications(ops, ackID);
        }
    }    

    // PendingSubscribe tracks the state for a pending initial
    // subscription.  
    class PendingSubscribe {
        constructor(subID, url, clientOps, done) {
            this._subID = subID;
            this._url = url;
            this._clientOps = clientOps;
            this._done = done;
        }

        subscribe(conn) {
            const {modelID} = services.ModelUrl.parse(this._url);
            conn.subscribe(this._subID, modelID, this._clientOps);
        }

        createBridge(rebased, clientRebased) {
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
            const cops = this._clientOps;
            if (cops && cops.length > 0) parentID = cops[cops.length-1].ID;

            return new services.SyncBridge({url: this._url, model, basisID, parentID});
        }

        complete(bridge) {
            this._done(bridge);
            this._done = null;
        }
    }

    // AttachedBridge tracks the state of an attached
    // sync bridge.
    class AttachedBridge {
        constructor(subID, conn, bridge) {
            this._conn = conn;
            this._subID = subID;
            this._bridge = bridge;
            this._cleanup = null;
        }

        disconnect() {
            this.cleanup();
        }
        
        reconnect() {
            const {modelID} = services.ModelUrl.parse(this._bridge.url);
            const {_subID: subID, _bridge: bridge} = this;
            
            bridge.rollUpChanges();
            const r = {BasisID: bridge.basisID, ParentID: bridge.parentID};
            this._conn.reconnect(subID, modelID, bridge.ops, r);
            this.setupFlusher();
        }

        setupFlusher() {
            if (this._cleanup) return;
            const {_subID: subID, _bridge: bridge, _conn: conn} = this;
            this._cleanup = bridge.events.on('localChangeFlush', flush);
            function flush() {
                bridge.rollUpChanges();
                conn.append(subID, bridge.ops.slice(-1));
            }
        }
        
        handleNotifications(ops, ackID) {
            this._bridge._applyServerOperations(ops);
            this._bridge._clearAcknowledgements(ackID);
        }
        
        cleanup() {
            if (!this._cleanup) return;
            this._cleanup();
            this._cleanup = null;
        }
    }

    return SyncMuxer;
}

