// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {registerChangeClass} from './change.js';
import {decodeValue} from './value.js';
import {Null} from './null.js';

// Replace represents a change of one value to another
export class Replace {
    constructor(before, after) {
	this.before = before;
	this.after = after;
    }

    revert() {
        return new Replace(this.after, this.before);
    }

    merge(other) {
        if (other == null) {
            return [null, this]
        }
        if (other instanceof Replace) {
            return this._mergeReplace(other)
        }
    }

    _mergeReplace(other) {
        if (this.isDelete() && other.isDelete()) {
            return [null, null];
        }
        return [new Replace(this.after, other.after), null];
    }

    isDelete() {
        return this.after instanceof Null;
    } 

    isCreate() {
        return this.before instanceof Null;
    }
   
    toJSON() {
	const btype = this.before.constructor.typeName();
	const atype = this.after.constructor.typeName();
	return [{[btype]: this.before}, {[atype]: this.after}];
    }
    
    static typeName() {
	return "changes.Replace";
    }
    
    static fromJSON(decoder, json) {
	const before = decodeValue(decoder, json[0]);
	const after = decodeValue(decoder, json[1]);
	return new Replace(before, after);
    }
}

registerChangeClass(Replace);
