// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateModelCache is a builder for the ModelCache service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateModelCache(services) {
    // ModelCache maintains a cache of models.  This version only
    // stores it in memory but this can be implemented on local
    // storage or even indexeddb, for example
    return class ModelCache {
        constructor() {
            this._models = {};
        }

        save(subID, modelID, model, basisID, pendingOps) {
            this._models[modelID] = {subID, model, basisID, pendingOps};
        }

        // fetch returns an object with three fields:
        // model => a strongly-typed Model object (not raw json).
        // basisID => the basis ID of this model.
        // pendingOps => the set of ops pending on this model.
        fetch(subID, modelID) {
            const m = this._models[modelID];
            if (m && m.subID === subID) return m;
            return {model: new services.ModelText(""), pending: [], basisID: ""};
        }
    }
}
