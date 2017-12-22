'use strict';

import {diff}  from "./diff.js";
export {manageTextArea};

function manageTextArea(elt, onChange) {
    let cursor = [0, 0];
    let value = elt.value;

    elt.addEventListener("mouseup", function() {
        cursor = [elt.selectionStart, elt.selectionEnd];
        onChange(null, cursor);
    });
    
    elt.addEventListener("keyup", function() {
	const change = diff(value, elt.value);
	value = elt.value;
        cursor = [elt.selectionStart, elt.selectionEnd];
	if (change) {
	    console.log("change = ", JSON.stringify(change))
        }
	onChange(change, cursor);
    });	    
    return update;

    function update(val, c) {
	console.log("New value =", val, c);
	elt.value = value = val;
        if (c) {
            cursor = c;
            if (document.activeElement !== elt) return;
            elt.selectionStart = c[0];
            elt.selectionEnd = c[1];
        }
    }
}
