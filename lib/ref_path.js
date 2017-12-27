// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateRefPath is a builder for the RefPath class. 
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateRefPath(services) {
    const empty = [];

    function norm(key) {
        const i = +key;
        if (Number.isNaN(i)) return key;
        return i.toString();
    }

    // RefPath has tools to maintain a path when changes happen.
    return class RefPath {
        constructor(initialPath) {
            this._path = (initialPath || []).slice(0);
            this._client = null;
            this._unsub = null;
            this.events = new services.Events();
        }

        linkTo(client) {
            this.unlink();
            this._client = client;
            this._unsub = client.events.on('remoteChange', (e, d) => this._onRemoteChange(e, d));
        }

        unlink() {
            if (!this._unsub) return;
            this._unsub();
            this._client = null;
        }

        get path() { return this._path.slice(0); }
        set path(value) { this._path = value.slice(0); }

        getValue(optResolver) {
            return (optResolver || this._client).getValue(this._path);
        }
            
        onChange(index, change) {
            const l = this._path || empty, r = change.Path || empty;
            let li = 0, ri = index;
            while (li < l.length && ri < r.length && norm(l[li]) == norm(r[ri])) {
                li ++;
                ri ++;
            }

            // if the paths do not intersect, no change at all
            if (ri !== r.length && li !== l.length) return;
            
            // if the mutation is deeper than the current path, emit a change
            if (li === l.length) return this.events.emit('valueChange', {change});

            // ri == r.length
            if (change.Set) {
                if (change.Set.Key != l[li]) return;
                // TODO: there is no guarantee that the path is even valid anymore
                return this.events.emit('valueChange', {change});
            }

            // array mutations.  Splice and Move change indices.
            if (change.Splice) {
                const index = +norm(l[li]);
                const {Offset: offset, Before: before, After: after} = change.Splice;
                const removed = services.ArrayLike.count(before);
                const inserted = services.ArrayLike.count(after);

                if (offset + removed <= index) {
                    l[li] = (index + inserted - removed).toString();
                    return this.events.emit('pathChange', {change, after: l});
                }

                if (offset < index) {
                    l[li] = offset.toString();
                    return this.events.emit('pathChange', {change, after: l});
                }
                return;
            }

            if (change.Move) {
                const index = +norm(l[li]);
                const {Offset: offset, Count: count, Distance: distance} = change.Move;
                if (index < offset + distance && index < offset) return;
                if (index >= offset + distance && index < offset) {
                    l[li] = (index + count).toString();
                    return this.events.emit('pathChange', {change, after: l});
                }
                if (index >= offset && index < offset + count) {
                    l[li] = (index + distance).toString();
                    return this.events.emit('pathChange', {change, after: l});
                }
                if (index >= offset + count && index < offset + count + distance) {
                    l[li] = (index - count).toString();
                    return this.events.emit('pathChange', {change, after: l});
                }
                return;
            }
        }
        
        _onRemoteChange(_event, data) {
            if (Array.isArray(data.change)) {
                data.change.forEach(ch => this.onChange(data.index || 0, ch));
                return;
            }
            this.onChange(data.index, data.change);
        }
    }
}
