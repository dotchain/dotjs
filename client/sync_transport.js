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
    /**
     * SyncTransport implements a basic transport to the
     * [DOT Log service]{@link https://github.com/dotchain/dots}.
     *
     * @see SyncBridge
     *
     * @example <caption>Creating the class </caption>
     *    // All of dotjs uses a builder pattern where a property
     *    // bag named "services" maintains all the classes
     *    // All classes are created the same way:
     *    import {CreateSyncBridge} from "dotjs/client/sync_transport.js";
     *    services.SyncTransport = CreateSyncTransport(services);
     *
     * @example <caption>Subscribe and initialize a model</caption>
     *    // to subscribe to: *https://example.com/dot/tasks/123
     *    transport = new services.SyncTransport();
     *    trqnsport.initialize(
     *       "https://example.com/dot/tasks/123",
     *       [],
     *       (bridge) => {
     *            // see SyncBridge on how to use a bridge
     *            // in particular: bridge.model.getValue()
     *       });
     */
    class SyncTransport {
        constructor() {
            this.events = new services.Events();
            this._log = new services.Log("transport: ");

            // url => SyncMuxer
            this._muxers = {};
            // bridge => subID
            this._subs = new Map();
        }

        /** get the latest model at the url and subscribe to it
         * <br>
         * @param url {Url} model url
         * @param clientOps {Operations} any pending local ops
         * @param done {Function} callback with bridge value.
         */
        initialize(url, clientOps, done) {
            const subID = (new services.UUID()).toString();
            const {wsUrl} = services.ModelUrl.parse(url);
            this._muxers[wsUrl] = this._muxers[wsUrl] || new services.SyncMuxer(wsUrl);
            this._muxers[wsUrl].initialize(subID, url, clientOps, bridge => {
                this._subs[bridge] = {subID, wsUrl};
                if (done) done(bridge);
            });
        }

        _attachBridge(bridge) {
            const url = bridge.url;
            const {wsUrl} = services.ModelUrl.parse(url);
            this._muxers[wsUrl] = this._muxers[wsUrl] || new services.SyncMuxer(wsUrl);
            const subID = this._muxers[wsUrl].attach(bridge);
            this._subs[bridge] = {subID, wsUrl};
        }

        _detachBridge(bridge) {
            if (!this._subs[bridge]) return;
            const {subID, wsUrl} = this._subs[bridge];
            delete(this._subs[bridge]);
            this._muxers[wsUrl].detach(subID);
        }
    }
    return SyncTransport;
}
