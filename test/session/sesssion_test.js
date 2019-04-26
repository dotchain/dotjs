// Copyright (C) 2019 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Session, Operation, Replace, Atomic } from "../..";

describe("Session", () => {
  // eslint-disable-next-line
  Operation.useCrypto(require("crypto"));

  it("writes pending", () => {
    const s = new Session().withPending(getSampleOps(), 3);
    let written = null;

    const conn = {
      write(ops) {
        written = ops;
        return Promise.resolve(null);
      }
    };

    return s.push(conn).then(() => {
      expect(written).to.deep.equal(getSampleOps());
    });
  });

  it("writes pending and more", () => {
    const s = new Session().withPending(getSampleOps(), 3);
    let written = null;
    let resolve = null;

    const conn = {
      write(ops) {
        written = ops;
        return new Promise(r => {
          resolve = r;
        });
      }
    };

    const result = s.push(conn);
    expect(written).to.deep.equal(getSampleOps());
    written = null;
    const c1 = new Replace(new Atomic(2), new Atomic(3));
    s.stream.append(c1);
    const c2 = new Replace(new Atomic(3), new Atomic(4));
    s.stream.append(c2);
    expect(s.push(conn)).to.equal(result);
    resolve(null);

    return result.then(() => {
      expect(written).to.equal(null);
      const result2 = s.push(conn);
      expect(written && written.length).to.equal(2);
      expect(written[0].changes).to.deep.equal(c1);
      expect(written[0].parentId).to.equal("id2");
      expect(written[1].changes).to.deep.equal(c2);
      expect(written[1].parentId).to.equal(written[0].id);
      expect(written[0].id).to.not.equal(null);
      expect(written[1].id).to.not.equal(null);
      resolve(null);
      return result2;
    });
  });

  it("reads", () => {
    const s = new Session().withPending(null, 3);
    const str = s.stream.append(new Replace(new Atomic(3), new Atomic(4)));
    let written = null;

    return s
      .pull({
        read(version) {
          expect(version).to.equal(4);
          const replace = new Replace(new Atomic(3), new Atomic(10));
          return Promise.resolve(
            new Operation("id", "parentId", 4, -1, replace)
          );
        }
      })
      .then(() => {
        return s.pull({
          read(version) {
            expect(version).to.equal(5);
            return Promise.resolve(null);
          }
        });
      })
      .then(() => {
        expect(str.nextInstance).to.not.equal(null);
        expect(str.nextChange).to.equal(null);
        return s.push({
          write(ops) {
            written = ops;
            return Promise.resolve(null);
          }
        });
      })
      .then(() => {
        expect(written && written.length).to.equal(1);
        expect(written[0].changes).to.deep.equal(
          new Replace(new Atomic(10), new Atomic(4))
        );
        expect(written[0].id).to.not.equal(null);
        expect(written[0].parentId).to.equal(null);
        expect(written[0].basis).to.equal(4);
        expect(written[0].version).to.equal(-1);
        expect(s.pending).to.deep.equal(written);
      });
  });
});

function getSampleOps() {
  const replace = new Replace(new Atomic(1), new Atomic(2));
  return [
    new Operation("id", "parentId", 10, 100, replace),
    new Operation("id2", "parentId2", 11, 101, replace)
  ];
}
