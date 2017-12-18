// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateClient is a builder for the Client service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateClient(services) {
    // Client manages multiple websocket connections and
    // creates/manages models.  The mapping from modelID to the
    // correct websocket URL is provided by the mapper in the
    // constructor to th service.
    return class Client {
        constructor(mapper) {
            this._log = new services.Log("client: ");
            this._cache = new services.ModelCache();
            this._mapper = mapper;
            this._managers = {};
            this._subID
            this._conns = {};
        }

        subscribe(subID, modelID, done) {
            if (this._managers[subID]) return done(this._managers[subID], subID, modelID);
            
            const manager = new services.ModelManager(subID, modelID, this._cache, done);
            this._managers[subID] = manager;

            const url = this._mapper(modelID);
            this._conns[url] = this._conns[url] ||
                new services.ConnectionManager(url,this._managers);
            this._conns[url].add(subID, modelID);
        }

        unsubscribe(subID) {
            if (!this._managers[subID]) return;
            const url = this._mapper(this._managers[subID].modelID);
            this._conns[url].remove(subID);
            delete this._managers[subID];
        }
    }
}

