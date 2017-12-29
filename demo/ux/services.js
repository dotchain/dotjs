// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// lib
import {CreateArrayLike} from '../../lib/array_like.js';
import {CreateSparseArray} from '../../lib/sparse_array.js';
import {CreateRefPath} from '../../lib/ref_path.js';
import {CreateEvents} from '../../lib/events.js';
import {CreateLog} from '../../lib/log.js';
import {CreateRandom} from '../../lib/random.js';
import {CreateRetry} from '../../lib/retry.js';
import {CreateTimer} from '../../lib/timer.js';

// client/model
import {CreateModelText} from '../../client/model/text.js';

// client
import {CreateSyncBridge} from '../../client/sync_bridge.js';
import {CreateSyncTransport} from '../../../client/sync_transport.js';
import {CreateSyncMuxer} from '../../../client/sync_muxer.js';
import {CreateModelUrl} from '../../../client/model_url.js';
import {CreateConnection} from '../../client/conn.js';
import {CreateWebSocket} from '../../client/websocket.js';
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
services.Events = CreateEvents(services);

// client/model
services.ModelText = CreateModelText(services);

// client
services.SyncTransport = CreateSyncTransport(services);
services.SyncBridge = CreateSyncBridge(services);
services.SyncMuxer = CreateSyncMuxer(services);
services.ModelUrl = CreateModelUrl(services);
services.Connection = CreateConnection(services);
services.WebSocket = CreateWebSocket(services);
services.Log = CreateLog(services);
services.Random = CreateRandom(services);
services.Retry = CreateRetry(services);
services.Timer = CreateTimer(services);
services.UUID = CreateUUID(services);
