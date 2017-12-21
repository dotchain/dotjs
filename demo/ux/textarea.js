'use strict';

import {diff}  from "./diff.js";
export {manageTextArea};

function manageTextArea(elt, onChange) {
    let value = elt.value;
    elt.addEventListener("keyup", function() {
	const change = diff(value, elt.value);
	value = elt.value;
	if (change) {
	    console.log("change = ", JSON.stringify(change))
	    onChange(change);
	}
    });	    
    return update;

    function update(val) {
	console.log("New value =", val);
	elt.value = value = val;
    }
}
