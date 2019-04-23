// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {registerChangeClass} from './change.js';
import {decodeChange} from './change.js';

// PathChange represents a change at a specific path
export class PathChange {
    constructor(path, change) {
        if (path == undefined) {
            path = null;
        }
        if (change === undefined) {
            change = null;
        }

	this.path = path;
	this.change = change;
    }

    revert() {
        return new PathChange(this.path, this.change.revert());
    }

    toJSON() {
        // TODO: encode path
        if (this.change != null) {
            return [this.path, {[this.change.constructor.typeName()]: this.change}];
        }
	return [this.path, null];
    }

    static typeName() {
	return "changes.PathChange";
    }
    
    static fromJSON(decoder, json) {
        // TODO: decode path
	const change = decodeChange(decoder, json[1]);
	return new PathChange(json[0], change);
    }
}

registerChangeClass(PathChange);
