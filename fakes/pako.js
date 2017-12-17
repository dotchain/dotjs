// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

export class Inflator {
    constructor(options) {
        if (!options || options.to != 'string' || options.raw != true) {
            throw new Error("Invalid options: " + JSON.stringify(options));
        }
        this._result = null;
        this._err = null;
    }

    get result() {
        if (this._result === null) {
            throw new Error("result fetched without actual push");
        }

        const result = this._result;
        this._result = null;
        return result;
    }

    get err() {
        const err = this._err;
        this._err = null;
        return err === null ? 0 : err;
    }

    push(u8, flush) {
        if (flush != 2) {
            throw new Error("Invalid inflator push: " + flush);
        }
        this._result = String.fromCharCode.apply(null, u8);
        this._err = Inflator._nextErr || null;
        Inflator._nextErr = null;
    }

    static setNextError(err) {
        Inflator._nextErr = err;
    }
}

export class Deflator {
    constructor(options) {
        if (!options || options.raw != true) {
            throw new Error("Invalid options: " + JSON.stringify(options));
        }
        this._result = null;
        this._err = null;
    }

    get result() {
        if (this._result === null) {
            throw new Error("result fetched without actual push");
        }

        const result = this._result;
        this._result = null;
        return result;
    }

    get err() {
        const err = this._err;
        this._err = null;
        return err === null ? 0 : err;
    }

    push(str, flush) {
        if (flush != 2) {
            throw new Error("Invalid inflator push: " + flush);
        }
        const ab = new ArrayBuffer(str.length);
        const buf = new Uint8Array(ab);
        for (let kk = 0; kk < str.length; kk ++) {
            buf[kk] = str.charCodeAt(kk);
        }
        this._result = buf;
        this._err = Deflator._nextErr || null;
        Deflator._nextErr = null;
    }

    static setNextError(err) {
        Deflator._nextErr = err;
    }
}
