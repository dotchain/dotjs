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
    // constructor to the service.
    //
    // Client emits two events:
    //    localChange has event data = {change, index, before, after}
    //    remoteChange has event data = {change, index, before, after}
    //
    // The actual change is either an array or a single value JSON
    // structure that represents the change (as per the spec in
    // https://github.com/dotchain/site/Operation.md).  The index
    // refers to the first valid index in change.Path.
    //
    // Change paths are arrays of strings referring to where in the
    // JSON model the change happened.  Client tacks on the modelID on
    // top of it, so someone can watch for all client changes via this
    // mechanism.
    //
    // The before and after fields do not point the before and after
    // of the client (which being a singleton is not as useful).
    // Instead, the before/after refer to the ModelManager managing
    // the model where the change happened.
    //
    // Note that calling client.getValue on a change path (that has
    // the padded modelID) is guaranteed to return the model at that
    // path.
    //
    // A client also supports the apply(event, index, changeOrChanges)
    // method to apply local or remote changes.  The primary purpose
    // of this is to apply local changes (as remote changes will
    // happen via the websocket connection).  Note that local changes
    // can also be done directly on the model and in either case,
    // applying local changes will also bubble up the localChange
    // event.
    return class Client {
        constructor(mapper) {
            this.events = new services.Events();
            this._log = new services.Log("client: ");
            this._cache = new services.ModelCache();
            this._mapper = mapper;
            this._managers = {};
            this._subID
            this._conns = {};
        }

        getValue(path) {
            return this._managers[path[0]].man.getValue(path.slice(1));
        }

        apply(event, index, change) {
            if (Array.isArray(change)) {
                let result = null;
                change.forEach(ch => (result = this.apply(event, index, ch)));
                return result;
            }
            const path = change.Path;
            return this._managers[path[index]].man.apply(event, index+1, change);            
        }
        
        subscribe(subID, modelID, done) {
            if (this._managers[subID]) return done(this._managers[subID].man, subID, modelID);

            // Propagate manager events up by unshift the current modelID.
            // Note that before and after refer to the manager, not the client as that is
            // useless.
            const propagate = (event, data) => {
                const newData = Object.assign({}, data, {index: 0});
                if (Array.isArray(data.change)) {
                    newData.change = [];
                    data.change.forEach((ch, idx) => {
                        newData.change[idx] = fixup(ch);
                    });
                } else {
                    newData.change = fixup(data.change);
                }
                this.events.emit(event, newData);

                function fixup(change) {
                    const newPath = (data.change.Path || []).slice(data.index || 0);
                    newPath.unshift(modelID);
                    return Object.assign({}, change, {Path: newPath});
                }
            };
            
            const manager = new services.ModelManager(subID, modelID, this._cache, done);
            const cleanup1 = manager.events.on('localChange', propagate);
            const cleanup2 = manager.events.on('remoteChange', propagate);
            this._managers[subID] = {
                man: manager,
                cleanup() { cleanup1(), cleanup2(); }
            };

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

