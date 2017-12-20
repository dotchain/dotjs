// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateModelManager is a builder for the ModelManager service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateModelManager(services) {
    // ModelManager implements utilities for managing a subscription
    // to the log service
    return class ModelManager {
        constructor(subID, modelID, cache, onReady) {
            this._log = new services.Log("model["+modelID+"]." + subID + ": ");

            const {model, pending, basisID} = cache.fetch(subID, modelID);

            this._updated = () => null;
            this._id = modelID;
            this._subID = subID;
            this._model = model;
            this._model.setParent(this);
            this._pending = [].concat(pending);
            this._parent = null;
            this._parents = new Parents(basisID, pending);
            this._changes = [];
            this._conn = null;

            this._flushTimer = new services.Timer(() => this._flush());
            this._saveTimer = new services.Timer(() => {
                const pending = [].concat(this._pending);
                cache.save(subID, modelID, this._model, pending, this._parents.basisID);
            });

            if (basisID != "") {
                onReady(this, subID, modelID);
            } else {
                this._onReady = () => {
                    this._onReady = null;
                    onReady(this, subID, modelID);
                };
            }
        }

        setParent(p) {
            this._parent = p;
        }

        _propagateChange(change, oldModel, newModel) {
            if (this._parent) this._parent.onChange(change, oldModel, newModel);
        }
        
        get model() { return this._model; }
        get modelID() { return this._id; }
        
        onChange(change, oldModel, newModel) {
            if (this._model != oldModel) throw new Error("Invalid local change");
            this._model = newModel;
            this._changes.push(change);
            this._flushTimer.defer(0);
            this._propagateChange(change, oldModel, newModel);
        }
        
        onConnected(conn) {
            this._conn = conn;
            if (this._changes.length > 0) this._flushChanges();
            this._parents.updateParent(this._pending);
            conn.subscribe(this._subID, this._id, this._pending, this._parents.basisID, this._parents.parentID);
        }

        onDisconnected() {
            this._conn = null;
        }

        onBootstrap(rebased, clientRebased) {
            const old = this._model;
            const ops = rebased.concat(clientRebased);
            this._model = this._model.applyOperations(ops);
            this._parents.updateBasis(rebased);
            this._purgePending(((clientRebased || [])[0] || {}).ID);
            this._onReady();
            this._propagateChange(ops, old, this._model);
        }

        onNotificationResponse(ops, ackID) {
            this._purgePending(ackID);

            // if there are unflushed changes, can't apply any remote changes
            if (this._changes.length > 0) return;
            const o = [];
            for (let kk = 0; kk < (ops || []).length; kk ++) {
                if (!this._parents.canApply(ops[kk])) continue;
                o.push(ops[kk])
                this._parents.updateBasis([ops[kk]]);
            }
            const old = this._model;
            this._model = this._model.applyOperations(o);
            this._propagateChange(ops, old, this._model);
        }

        _flush() {
            // TODO: save does not handle the pending changes yet..
            this._saveTimer.defer(0);
            if (this._onReady || !this._conn || this._changes.length === 0) return;
            this._conn.append(this._subID, [this._flushChanges()]);
        }

        _flushChanges() {
            const id = new services.UUID().toString();
            const op = {ID: id, Parents: this._parents.pair, Changes: this._changes};
            this._pending.push(op);
            this._parents.updateParent([op])
            this._changes = [];
            return op;
        }
        
        _purgePending(ackID) {
            this._saveTimer.defer(0);
            for (let kk = this._pending.length; kk > 0; kk --) {
                if (this._pending[kk-1].ID === ackID) {
                    this._pending = this._pending.slice(kk);
                    break;
                }
            }
        }
    }
}


// Parents manages the parents state maintained by the model
// manager to stay in complaince with the log protocol
class Parents {
    constructor(basisID, pending) {
        this._basisID = basisID;
        this._parentID = this._lastID(pending);
    }
    
    updateBasis(ops) {
        this._basisID = this._lastID(ops) || this._basisID;
    }
    
    updateParent(ops) {
        this._parentID = this._lastID(ops) || this._parentID;
    }
    
    get basisID() {
        return this._basisID;
    }
    
    get pair() {
        return [this._basisID, this._parentID];
    }
    
    canApply(op) {
        const basisID = (op.Parents || [])[0] || "";
        const parentID = (op.Parents || [])[1] || "";
        return this._parentID === parentID && this._basisID === basisID;
    }
    
    _lastID(ops) {
        return (ops && ops.length > 0) ? ops[ops.length-1].ID : "";
    }
}
    
