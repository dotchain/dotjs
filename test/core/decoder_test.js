// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {decodeValue} from '../..';

export class FakeDecoder {
    decode(json) {
        if (json == null) {
            return null;
        }
        return decodeValue(this, json);
    }
}
