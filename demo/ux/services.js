// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {CreateClient} from '../../client/client.js';
import {CreateConnectionManager} from '../../client/conn_manager.js';
import {CreateConnection} from '../../client/conn.js';
import {CreateWebSocket} from '../../client/websocket.js';
import {CreateLog} from '../../client/log.js';
import {CreateModelCache} from '../../client/model_cache.js';
import {CreateModelText} from '../../client/model_text.js';
import {CreateModelManager} from '../../client/model_manager.js';
import {CreateRandom} from '../../client/random.js';
import {CreateRetry} from '../../client/retry.js';
import {CreateTimer} from '../../client/timer.js';
import {CreateUUID} from '../../client/uuid.js';

export const services = {
    NativeWebSocket: window.WebSocket,
//    Inflator: window.pako.Inflate,
//    Deflator: window.pako.Deflate
};

services.Client = CreateClient(services);
services.ConnectionManager = CreateConnectionManager(services);
services.Connection = CreateConnection(services);
services.WebSocket = CreateWebSocket(services);
services.Log = CreateLog(services);
services.ModelCache = CreateModelCache(services);
services.ModelText = CreateModelText(services);
services.ModelManager = CreateModelManager(services);
services.Random = CreateRandom(services);
services.Retry = CreateRetry(services);
services.Timer = CreateTimer(services);
services.UUID = CreateUUID(services);
