// Copyright (C) 2019 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Transformer } from "../../db/transform.js";
import { Operation } from "../../db/op.js";
import { Splice } from "../../db/splice.js";
import { Text } from "../../db/text.js";
import journalData from "./testdata/journals.js";

describe("Session with Transformer", () => {
  if (typeof crypto === "undefined") {
    // eslint-disable-next-line
    Operation.useCrypto(require("crypto"));
  }

  it("passes through writes", () => {
    let ops = null;
    const conn = {
      write: o => {
        ops = o;
      }
    };
    const t = new Transformer(conn);
    const opsToWrite = [new Operation()];
    t.write(opsToWrite);
    expect(ops).to.equal(opsToWrite);
  });

  const withRawCache = [" with raw cache", " without raw cache"];
  for (let rawCache of withRawCache) {
    const useRawCache = rawCache == withRawCache[0];
    for (let testName in journalData.test) {
      it(testName + rawCache, () => {
        const { raw, transformed, merge } = parseJournal(
          journalData.test[testName]
        );
        const cache = { untransformed: {}, transformed: {}, merge: {} };
        let conn = {
          read(version, limit) {
            const result = [];
            for (let kk = version; kk <= version + limit; kk++) {
              if (raw[version + kk]) {
                result.push(raw[version + kk]);
              }
            }
            return result;
          }
        };
        if (useRawCache) {
          cache.untransformed = raw;
          conn = null;
        }

        const t = new Transformer(conn, cache);
        return t.read(0, 100).then(() => {
          expect(cache.transformed).to.deep.equal(transformed);
          expect(cache.merge[2]).to.deep.equal(merge[2]);
          expect(cache.untransformed).to.deep.equal(raw);
        });
      });
    }
  }
});

function parseJournal(info) {
  const { journal, rebased, mergeChains } = info;
  const raw = {};
  const transformed = {};
  const merge = {};
  const versions = {};

  for (let ver = 0; ver < journal.length; ver++) {
    const [id, basisId, parentId, change] = journal[ver];
    versions[id] = ver;
    const basis = basisId ? versions[basisId] : -1;
    const c = parseChange(change);
    const op = new Operation(id, parentId || null, ver, basis, c);
    raw[ver] = op;
  }

  for (let ver = 0; ver < rebased.length; ver++) {
    const c = parseChange(rebased[ver]);
    const op = raw[ver];
    transformed[ver] = new Operation(
      op.id,
      op.parentId,
      op.version,
      op.basis,
      c
    );
  }

  for (let ver = 0; ver < mergeChains.length; ver++) {
    let basis = raw[ver].basis + 1;
    merge[ver] = mergeChains[ver].map(c => {
      const op = raw[basis];
      basis++;
      return new Operation(
        op.id,
        op.parentId,
        op.version,
        op.basis,
        parseChange(c)
      );
    });
  }

  return { raw, transformed, merge };
}

function parseChange(x) {
  if (!x) {
    return null;
  }

  const l = x.indexOf("(");
  const r = x.indexOf(")");
  const mid = x.slice(l + 1, r);
  const [midl, midr] = mid.split("=");
  return new Splice(l, new Text(midl), new Text(midr));
}
