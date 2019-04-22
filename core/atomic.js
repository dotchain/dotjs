// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {registerValueClass, decodeValue} from './value.js'
import {Replace} from './replace.js'

// Atomic represents an atomic value type
export class Atomic {
    constructor(value) {
        this.value = value
    }
    
    apply(c) {
        if (!c) {
            return this
        }
        if (c instanceof Replace && c.before instanceof Atomic) {
            return c.after
        }
        return c.applyTo(this)
    }

    toJSON() {
        return [{[this.value.constructor.typeName()]: this.value}]
    }

    static typeName() {
        return "changes.Atomic"
    }

    static fromJSON(decoder, json) {
        return new Atomic(decodeValue(decoder, json[0]))
    }
}

registerValueClass(Atomic)

