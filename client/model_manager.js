// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateModelManager is a builder for the ModelManager service.
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateModelManager(services) {
    // ModelManager manages OT relate state for a model
    //
    // events:
    //    remoteChange {change, before, after}
    //    localChange {change, before, after}
    //    localChangeFlush {modelID}
    //    opsChange {modelID}
    //    initialized {modelID}
    return class ModelManager {
        constructor(json) {
            const snapshot = json || {};
            this._id = snapshot.id;
            this._model = snapshot.model || new services.ModelText("");
            this._basisID = snapshot.basisID || "";
            this._parentID = snapshot.parentID || "";
            this._changes = snapshot.changes || [];
            this._ops = snapshot.ops || [];
            this._log = new services.Log("model[" + this._id + "]: ");
            this._initializing = false;
            
            this._model.events.on('localChange', (e, d) => this._onLocalChange(e, d));
            this.events = new services.Events();
            this._flushTimer = new services.Timer(() => {
                this.events.emit('localChangeFlush', {modelID: this._id});
            });
        }

        get id() { return this._id; }
        get model() { return this._model; }
        get basisID() { return this._basisID; }
        get parentID() { return this._parentID; }
        get changes() { return this._changes.slice(0); }
        get ops() { return this._ops.slice(0); }

        startInitializing() {
            this._initializing = true;
        }

        finishInitializing(serverOps, clientOps) {
            this._initializing = false;

            // TODO: use a null model than an empty text model
            // (also copy events over then?)
            const applied = [];
            const ops = [].concat(serverOps, clientOps);
            for (let jj = 0; jj < ops.length; jj ++) {
                if (!ops[jj].Changes || ops[jj].Changes.length === 0) continue;
                for (let kk = 0; kk < ops[jj].Changes.length; kk ++) {
                    applied.push(ops[jj].Changes[kk]);
                    this._model = this._model.apply('remoteChange', 0, ops[jj].Changes[kk]);
                }
            }
            if (serverOps.length > 0) {
                this._basisID = serverOps[serverOps.length-1].ID;
            }
            if (applied.length > 0) {
                this.events.emit('remoteChange', {change: applied, before: this, after: this});
            }
            this.events.emit("initialized", {modelID: this._id});
        }
        
        getValue(path) {
            return this._model.getValue(path);
        }
        
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
            this.events.emit('opsChange', {modelID: this._id});
        }

        clearAcknowledgements(ackID) {
            for (let kk = 0; kk < this._ops.length; kk ++) {
                if (this._ops[kk].ID == ackID) {
                    this._ops.splice(0, kk+1);
                    this.events.emit('opsChange', {modelID: this._id});
                }
            }
        }
        
        toJSON() {
            return {
                id: this._id,
                model: this._model,
                basis: this._basis,
                parentID: this._parentID,
                basisID: this._basisID,
                ops: this._ops.slice(0),
                changes: this._changes.slice(0),
            };
        }

        applyChange(change) {
            this._model = this._model.apply('localChange', 0, change);
        }
        
        applyServerOperations(ops) {
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
                this.events.emit('remoteChange', {change: applied, before: this, after: this});
            }
        }

        _onLocalChange(_event, data) {
            if (this._model !== data.before) {
                throw new Error("Unexpected before");
            }
            if (this._intializing) throw new Error("Cannot modify when initializing");

            if (Array.isArray(data.change)) this._changes = this._changes.concat(data.change);
            else this._changes.push(data.change);
            
            this._model = data.after;
            const bubble = {change: data.change, before: this, after: this};
            this.events.emit('localChange', bubble);

            // the flush timer controls when the localChangeFlush event is
            // emitted which is what is used by the transport to decide to
            // roll up all the changes and send it out.
            this._flushTimer.defer(0);
        }
    }
}
