// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateSyncBridge is a builder for the SyncBridge service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateSyncBridge(services) {
    /**
     * SyncBridge manages OT relate state for a model and connects
     * to the SyncTransport for two-way synchronization
     * 
     * @param snapshot {JSON} See examples
     *
     * @example <caption>Creating the class </caption>
     *    // All of dotjs uses a builder pattern where a property
     *    // bag named "services" maintains all the classes
     *    // All classes are created the same way:
     *    import {CreateSyncBridge} from "dotjs/client/sync_bridge.js";
     *    services.SyncBridge = CreateSyncBridge(services);
     *
     * @example <caption>Using the sync bridge</caption>
     *    bridge = new services.SyncBridge({
     *      id: "Model ID",
     *      model: <actual Model>,
     *      basisID: "last server op applied to the model",
     *      parentID: "last local op applied to the model",
     *      ops: [set of local ops that have not been acknowledged],
     *      changes: [set of local changes that have not been sent up to server],
     *    });
     * @example <caption>Attaching and detaching bridges</caption>
     *    // A bridge can be attached to a transport and it will start syncing.
     *    bridge.attach(syncTransport);
     *    // A bridge can be detached:
     *    bridge.detach();
     *    // even after a bridge has been detached, the models can be
     *    // modified.  when reattached, the changes will get synced.
     * @example <caption>Saving the bridge between sessions</caption>
     *    const snapshot = bridge.toJSON();
     *    // the snapshot can be store locally and in a later session:
     *    const revivedBridge = new SyncBridge(snapshot);
     *
     * @example <caption>Watching for remote changes</caption>
     *    bridge.events.on('remoteChange', (event, data) => {
     *        // data.change is the actual change.
     *        // data.before and data.after refer to the model
     *        // before and after the change
     *    });
     * @example <caption>Watching for local changes</caption>
     *    // local changes are less interesting as most clients
     *    // control this themselves but it is still useful to
     *    // track UNDO data etc.
     *    bridge.events.on('localChange', (event, data) => {
     *        // data.change is the actual change.
     *        // data.before and data.after refer to the model
     *        // before and after the change
     *    });
     */
    class SyncBridge {
        constructor(json) {
            const snapshot = json || {};
            this._url = snapshot.url;
            const {modelID, path} = services.ModelUrl.parse(this._url);
            this._id = modelID;
            this._path = path;
            this._model = snapshot.model || new services.ModelText("");
            this._basisID = snapshot.basisID || "";
            this._parentID = snapshot.parentID || "";
            this._changes = snapshot.changes || [];
            this._ops = snapshot.ops || [];
            this._log = new services.Log("model[" + this._id + "]: ");
            
            this._model.events.on('localChange', (e, d) => this._onLocalChange(e, d));
            this._transport = null;
            
            this.events = new services.Events();
            this._flushTimer = new services.Timer(() => {
                this.events.emit('localChangeFlush', {modelID: this._id});
            });
        }

        /**
         * Start syncing changes using the provided {@link transport}.
         * A bridge that has prior local changes will start pushing those
         * immediately.  If the transport has not established a
         * connnection, it will set one up in response to this call.
         * @param transport {SyncTransport} transport to attach to.
         */
        attach(transport) {
            if (this._transport != null) throw new Error("Cannot attach before detaching");
            transport._attachBridge(this);
            this._transport = transport;
        }

        /**
         * Stop syncing changes with the transport. A detached bridge
         * still tracks changes so that when it is attached later, the
         * sync mechanism will account for those.
         */
        detach() {
            this._transport.detachBridge(this);
            this._transport = null;
        }

        /** Model URL */
        get url() { return this._url; }

        /** Current model.  Note that models may be persistent data
         * strutures and so may change */
        get model() { return this._model; }

        /** The last server operation factored into the model */
        get basisID() { return this._basisID; }

        /** The last local operation applied to the model */
        get parentID() { return this._parentID; }

        /** Set of operations that have not been acknowledged */
        get ops() { return this._ops.slice(0); }

        /** If there any local changes, create an operation for them */
        rollUpChanges() {
            if (this._changes.length > 0) {
                const id = (new services.UUID()).toString();
                this._ops.push({
                    ID: id,
                    Parents: [this._basisID, this._parentID],
                    Changes: this._changes.slice(0),
                });
                this._changes.length = 0;
                this._parentID = id;
            }
        }

        /** Snapshot the bridge sync state */
        toJSON() {
            let model = this._model;
            if (model.toJSON) model = model.toJSON();
            
            return {
                url: this._url,
                model: model,
                basis: this._basis,
                parentID: this._parentID,
                basisID: this._basisID,
                ops: this._ops.slice(0),
                changes: this._changes.slice(0),
            };
        }

        /* remove all pending operations earlier ot at provided ID */
        _clearAcknowledgements(ackID) {
            for (let kk = 0; kk < this._ops.length; kk ++) {
                if (this._ops[kk].ID == ackID) {
                    this._ops.splice(0, kk+1);
                }
            }
        }
        
        /* update model and basisID for the operations provided by
         * server */
        _applyServerOperations(ops) {
            const before = this._model;
            if (this._changes.length > 0 ) {
                this._log.warn("skipping operations due to local changes");
                return;
            }

            const applied = [];
            for (let jj = 0; jj < ops.length; jj ++) {
                if (!ops[jj].Changes || ops[jj].Changes.length === 0) continue;
                
                const parents = ops[jj].Parents || [];
                const basisID = parents[0] || "", parentID = parents[1] || "";
                if (basisID !== this._basisID || parentID !== this._parentID) {
                    this._log.warn("skipping operation", ops[jj].ID)
                    continue;
                }
                for (let kk = 0; kk < ops[jj].Changes.length; kk ++) {
                    applied.push(ops[jj].Changes[kk]);
                    this._model = this._model.apply('remoteChange', 0, ops[jj].Changes[kk]);
                }
                this._basisID = ops[jj].ID;
            }
            if (applied.length > 0) {
                const data = {change: applied, before, after: this._model};
                this.events.emit('remoteChange', data);
            }
        }

        /* track model changes */
        _onLocalChange(event, data) {
            if (this._model !== data.before) {
                throw new Error("Unexpected before");
            }

            if (Array.isArray(data.change)) this._changes = this._changes.concat(data.change);
            else this._changes.push(data.change);
            
            this._model = data.after;
            this.events.emit(event, data);

            // the flush timer controls when the localChangeFlush event is
            // emitted which is what is used by the transport to decide to
            // roll up all the changes and send it out.
            this._flushTimer.defer(0);
        }
    }

    return SyncBridge;
}
