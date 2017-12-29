// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {services} from './services.js';
import {manageTextArea} from './textarea.js';

services.ModelUrlMapper = class ModelUrlMapper {
    static fromModelID() {
        return "ws://localhost:8181/log";
    }
};

document.addEventListener("DOMContentLoaded", main);
function main() {
    const elts = document.querySelectorAll('.panel');
    for (let kk = 0; kk < elts.length; kk ++) {
        panel(elts[kk], kk+1);
    }
}

function panel(panel, index) {
    let startCounter = (index-1)*100000;
    let update;
    
    const transport = new services.SyncTransport();
    const log = new services.Log("panel" + index + ": ");
    const timer = new services.Timer(() => null);
    const refStart = new services.RefPath([0]);
    const refEnd = new services.RefPath([0]);

    transport.initialize("http://localhost:8181/log/grootza", [], bridge => {
        const elt = document.createElement('textarea');
        elt.style = "border: 10px solid white; width: 100%; box-sizing: border-box; min-height: 200px;";
        panel.appendChild(elt);

        update = manageTextArea(elt, (change, c) => {
            if (change) {
                bridge.applyChange({Splice: change});
            }
            refStart.path = [c[0]];
            refEnd.path = [c[1]];
        })

        update(bridge.getValue(), [0, 0]);

        bridge.events.on('remoteChange', (_ignored, data) => {
            update(bridge.getValue(), [+refStart.path[0], +refEnd.path[0]]);
        });
        refStart.linkTo(bridge);
        refEnd.linkTo(bridge);
        
        if (startCounter > 0) timer.defer(5000);
    });

    log.log("Initialized")
}
