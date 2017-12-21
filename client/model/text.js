// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateModelText is a builder for the ModelText class. 
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateModelText(services) {
    const empty = [];
    
    // ModelText implements the Model interface for text
    return class ModelText {
        constructor(initial, events) {
            this.events = events || new services.Events();
            this._text = initial || "";
        }

        toJSON() {
            return this._text;
        }

        value() {
            return this._text;
        }
        
        getValue(path) {
            if (path && path.length > 0) throw new Error("invalid path: " + path);
            return this._text;
        }
        
        apply(event, index, change) {
            let  result = this;
            if (Array.isArray(change)) {
                change.forEach(ch => (result = result._apply(index, ch)));
            } else {
                result = result._apply(index, change);
            }

            this.events.emit(event, {change, index, before: this, after: result});
            return result;
        }
        
        splice(offset, count, insert) {
            const before = this._text.slice(offset, offset+count);
            const change = {Splice: {Offset: offset, Before: before, After: insert || ""}}
            return this.apply('localChange', 0, change);
        }

        move(offset, count, distance) {
            const change = {Move: {Offset: offset, Count: count, Distance: distance}};
            return this.apply('localChange', 0, change);
        }
        
        _apply(index, change) {
            const path = (change.Path || empty);
            if (index < path.length) {
                throw new Error("Unexpected path with text model: " + path);
            }

            if (change.Set) {
                throw new Error("Unexpected set with text model: " + JSON.stringify(change.Set));
            } else if (change.Range) {
                throw new Error("Unexpected range with text model: " + JSON.stringify(change.Range));
            } else if (change.Splice) {
                const offset = change.Splice.Offset;
                const count = (change.Splice.Before || "").length;
                const after = change.Splice.After || "";
                const result = this._text.slice(0, offset) + after + this._text.slice(offset + count);
                return new ModelText(result, this.events);
            } else if (change.Move) {
                const {Offset: offset, Count: count, Distance: distance} = change.Move;
                const slice = this._text.slice(offset, offset+count);
                const before = this._text.slice(0, offset) + this._text.slice(offset + count);
                const left = before.slice(0, offset+distance);
                const right = before.slice(offset+distance);
                const result = left + slice + right;
                return new ModelText(result, this.events);
            } else {
                return this
            }
        }
    }        
}
