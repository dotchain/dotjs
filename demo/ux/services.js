// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// lib
import {CreateArrayLike} from '../../lib/array_like.js';
import {CreateSparseArray} from '../../lib/sparse_array.js';
import {CreateRefPath} from '../../lib/ref_path.js';
import {CreateEvents} from '../../lib/events.js';

// client/model
import {CreateModelText} from '../../client/model/text.js';
import {CreateModelManager} from '../../client/model/manager.js';

// client
import {CreateTransport} from '../../../client/transport.js';
import {CreateConnection} from '../../client/conn.js';
import {CreateWebSocket} from '../../client/websocket.js';
import {CreateLog} from '../../client/log.js';
import {CreateRandom} from '../../client/random.js';
import {CreateRetry} from '../../client/retry.js';
import {CreateTimer} from '../../client/timer.js';
import {CreateUUID} from '../../client/uuid.js';

export const services = {
    NativeWebSocket: window.WebSocket,
    Inflator: window.pako.Inflate,
    Deflator: window.pako.Deflate
};

// lib
services.ArrayLike = CreateArrayLike(services);
services.SparseArray = CreateSparseArray(services);
services.RefPath = CreateRefPath(services);

// client/model
services.Events = CreateEvents(services);
services.ModelText = CreateModelText(services);
services.ModelManager = CreateModelManager(services);

// client
services.Transport = CreateTransport(services);
services.Connection = CreateConnection(services);
services.WebSocket = CreateWebSocket(services);
services.Log = CreateLog(services);
services.Random = CreateRandom(services);
services.Retry = CreateRetry(services);
services.Timer = CreateTimer(services);
services.UUID = CreateUUID(services);
