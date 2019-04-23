// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {registerChangeClass} from './change.js';
import {decodeChange} from './change.js';
import {encode} from './encode.js';

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
        let path = null;

        if (this.path !== null) {
            path = this.path.map(encode);
        }

        return [path, encode(this.change)]
    }

    static typeName() {
	return "changes.PathChange";
    }
    
    static fromJSON(decoder, json) {
        let path = json[0];

        if (path !== null) {
            path = path.map(decoder.decode)
        }
            
	const change = decodeChange(decoder, json[1]);
	return new PathChange(path, change);
    }
}

registerChangeClass(PathChange);
