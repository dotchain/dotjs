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
    let manager = null;
    const client = new services.Client(() => "ws://localhost:8181/log");
    const timer = new services.Timer(updateCounter);
    
    log.log("Initialized")
    client.subscribe("grootza", "grootza", m => {
        const elt = document.createElement('textarea');
        elt.style = "border: 10px solid white; width: 100%; box-sizing: border-box; min-height: 200px;";
        panel.appendChild(elt);

        manager = m;

        update = manageTextArea(elt, change => {
            m.model.applyLocal({Splice: change});
        })

        m.events.on('remoteOperations', (_ignored, change) => update(change.after));
        if (startCounter > 0) timer.defer(5000);
    });

    function updateCounter() {
        const m = manager.model;
        timer.defer(5000);
        
        const last = startCounter + " ";
        startCounter ++;
        const current = startCounter + " ";
        let offset = 0;

        if (index == 2) {
            if (m.value().slice(offset, last.length) == last) {
                update(m.applyLocal({Splice: {Offset: offset, Before: last, After: current}}));
                return
            }
        } else {
            offset = m.value().length;
            if (m.value().slice(offset - last.length) == last) {
                update(m.applyLocal({Splice: {Offset: offset - last.length, Before: last, After: current}}));
                return;
            }
        }
        update(m.applyLocal({Splice: {Offset: offset, Before: "", After: current}}));
    }
}
