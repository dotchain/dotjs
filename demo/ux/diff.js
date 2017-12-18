'use strict';

export {diff}

/**
   diff takes two strings (new value, old value) and returns a SpliceInfo
   structure which describes the changes.  It returns null for no changes.
 
   SpliceInfo is a struct with Offset = where the change happens and two
   fields Before and After which represents the minimal string that got
   changes from the offset.  Either Before or After can be empty strings.

   Please see github.com/rameshvk/dot for actual structure of SpliceInfo.
 */
function diff(s1, s2) {
    if (s1 == s2) return null;

    let offset = 0;
    for (; s1[offset] === s2[offset]; offset ++) {}
    let end1 = s1.length, end2 = s2.length;

    for (; end1 > offset && end2 > offset && s1[end1-1] === s2[end2-1]; end1 --, end2 --) {}

    return {Offset: offset, Before: s1.slice(offset, end1), After: s2.slice(offset, end2)}            
}