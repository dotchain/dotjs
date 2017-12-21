// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

import {services} from './services.js';
import {manageTextArea} from './textarea.js';

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
    const log = new services.Log("panel" + index + ": ");
    const client = new services.Client(() => "ws://localhost:8181/log");
    const timer = new services.Timer(updateCounter);
    
    log.log("Initialized")
    client.subscribe("grootza", "grootza", () => {
        const elt = document.createElement('textarea');
        elt.style = "border: 10px solid white; width: 100%; box-sizing: border-box; min-height: 200px;";
        panel.appendChild(elt);

        update = manageTextArea(elt, change => {
            client.apply('localChange', 0, {Path: ['grootza'], Splice: change});
        })

        client.events.on('remoteChange', (_ignored, data) => update(data.after.getValue()));
        if (startCounter > 0) timer.defer(5000);
    });

    function updateCounter() {
        var change;
        timer.defer(5000);
        
        const last = startCounter + " ";
        startCounter ++;
        const current = startCounter + " ";
        let offset = 0;

        const val = client.getValue(['grootza']);
        if (index == 2) {
            if (val.slice(offset, last.length) == last) {
                change = {Path: ["grootza"], Splice: {Offset: offset, Before: last, After: current}};
                update(client.apply('localChange', 0, change).getValue());
                return
            }
        } else {
            offset = val.length;
            if (val.slice(offset - last.length) == last) {
                change = {Path: ["grootza"], Splice: {Offset: offset - last.length, Before: last, After: current}};
                update(client.apply('localChange', 0, change).getValue());
                return;
            }
        }
        change = {Path: ['grootza'], Splice: {Offset: offset, Before: "", After: current}}
        update(client.apply('localChange', 0, change).getValue());
    }
}
