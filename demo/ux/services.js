// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateClient} from '../../client/client.js';
import {CreateConnectionManager} from '../../client/conn_manager.js';
import {CreateConnection} from '../../client/conn.js';
import {CreateWebSocket} from '../../client/websocket.js';
import {CreateLog} from '../../client/log.js';
import {CreateModelCache} from '../../client/model/cache.js';
import {CreateModelText} from '../../client/model/text.js';
import {CreateModelArray} from '../../client/model/array.js';
import {CreateSparseArray} from '../../client/model/sparse.js';
import {CreateModelManager} from '../../client/model/manager.js';
import {CreateEvents} from '../../client/model/events.js';
import {CreateRandom} from '../../client/random.js';
import {CreateRetry} from '../../client/retry.js';
import {CreateTimer} from '../../client/timer.js';
import {CreateUUID} from '../../client/uuid.js';

export const services = {
    NativeWebSocket: window.WebSocket,
    Inflator: window.pako.Inflate,
    Deflator: window.pako.Deflate
};

services.Client = CreateClient(services);
services.ConnectionManager = CreateConnectionManager(services);
services.Connection = CreateConnection(services);
services.WebSocket = CreateWebSocket(services);
services.Log = CreateLog(services);
services.Events = CreateEvents(services);
services.ModelCache = CreateModelCache(services);
services.ModelText = CreateModelText(services);
services.ModelArray = CreateModelArray(services);
services.SparseArray = CreateSparseArray(services);
services.ModelManager = CreateModelManager(services);
services.Random = CreateRandom(services);
services.Retry = CreateRetry(services);
services.Timer = CreateTimer(services);
services.UUID = CreateUUID(services);
