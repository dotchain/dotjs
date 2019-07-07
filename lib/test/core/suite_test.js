// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import { PathChange, Splice, Move, Changes, Text } from "../../index.js";

import compactSpliceInfo from "./testdata/splices.js";
import compactMoveInfo from "./testdata/moves.js";
import compactSpliceMoveInfo from "./testdata/splicemoves.js";

describe("Splice - dataset tests", () => {
  testMergeSuite(compactSpliceInfo.test);
});

describe("SpliceMove - dataset tests", () => {
  testMergeSuite(compactSpliceMoveInfo.test);
});

describe("Move - dataset tests", () => {
  testMergeSuite(compactMoveInfo.test);
});

function testMergeSuite(tests) {
  let count = 0;

  for (let test of tests) {
    count++;

    let [before, after, [left], [right], leftx, rightx] = test;

    it(count.toString() + ": " + left + " x " + right, () => {
      const [l, r, lx, rx] = [left, right, leftx, rightx].map(parseChange);

      expect(l.merge(r).map(simplify)).to.deep.equal([lx, rx].map(simplify));
      expect(r.reverseMerge(l).map(simplify)).to.deep.equal(
        [rx, lx].map(simplify)
      );
      expect(new Text(before).apply(l).apply(lx)).to.deep.equal(
        new Text(after)
      );
      expect(new Text(before).apply(r).apply(rx)).to.deep.equal(
        new Text(after)
      );
    });
  }
}

function simplify(c) {
  if (c instanceof Splice) {
    if (JSON.stringify(c.before) == JSON.stringify(c.after)) {
      return null;
    }
  }

  if (c instanceof Move) {
    if (c.distance === 0 || c.count === 0) {
      return null;
    }
  }

  if (c instanceof PathChange) {
    if (c.path === null || c.path.length === 0) {
      return simplify(c.change);
    }
    const inner = simplify(c.change);
    if (inner === null) {
      return null;
    }
    return new PathChange(c.path, inner);
  }

  if (c instanceof Changes) {
    const result = [];
    for (let cx of c._all) {
      const inner = simplify(cx);
      if (inner != null) {
        result.push(inner);
      }
    }
    if (result.length === 0) {
      return null;
    }
    if (result.length === 1) {
      return result[0];
    }
    return new Changes(result);
  }

  return c;
}

function parseChange(x) {
  if (!x) {
    return null;
  }

  if (Array.isArray(x)) {
    if (x.length === 0) {
      return null;
    }
    if (x.length === 1) {
      return parseChange(x[0]);
    }
    return new Changes(x.map(parseChange));
  }

  const l = x.indexOf("(");
  const r = x.indexOf(")");
  const mid = x.slice(l + 1, r);

  if (x.indexOf("=") < l) {
    const [l1, l2] = x.slice(0, l).split("=");
    return new Move(l1.length + l2.length, mid.length, -l2.length);
  }

  if (x.indexOf("=") > r) {
    const [r1] = x.slice(r + 1).split("=");
    return new Move(l, mid.length, r1.length);
  }

  const [midl, midr] = mid.split("=");
  return new Splice(l, new Text(midl), new Text(midr));
}
