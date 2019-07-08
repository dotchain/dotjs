// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Bool, Null, Session, Text } from "../index.js";
import { Operation } from "../op.js";
import { Replace } from "../replace.js";
import { Splice } from "../splice.js";

if (typeof crypto === "undefined") {
  Operation.useCrypto(require("crypto"));
}

describe("Session", () => {
  it("serializes unconnected value", () => {
    const serialized = Session.serialize(new Bool(true));
    const root = Session.connect("", serialized);
    expect(root.clone()).to.deep.equal(new Bool(true));
  });

  it("serializes pending op for connected value", () => {
    const serialized = Session.serialize(new Bool(true));
    const root = Session.connect("", serialized);
    root.replace(new Text("hello"));

    const updated = Session.serialize(root);
    const hydrated = Session.connect("", updated);
    expect(hydrated.clone()).to.deep.equal(new Text("hello"));
    expect(updated.pending.length).to.equal(1);
    expect(updated.version).to.equal(-1);
  });

  it("writes pending on push", () => {
    let written = null;
    const conn = {
      write(ops) {
        written = ops;
        return Promise.resolve(null);
      }
    };

    const root = Session.connect(conn);
    root.replace(new Text("hello"));
    expect(written).to.equal(null);

    return root.push().then(() => {
      expect(written.length).to.equal(1);
      expect(written[0].changes).to.deep.equal(
        new Replace(new Null(), new Text("hello"))
      );
    });
  });

  it("resends pending on reconnect", () => {
    let written = null;
    let resolve = null;
    const conn = {
      write(ops) {
        written = ops;
        if (resolve) {
          // second time around complete both
          resolve(null);
          resolve = null;
          return Promise.resolve(null);
        }
        return new Promise(r => {
          resolve = r;
        });
      }
    };

    const root = Session.connect(conn);
    root.replace(new Text("hello"));
    expect(written).to.equal(null);

    root.push();
    expect(written.length).to.equal(1);
    // serialize and hydrate
    written = null;
    const next = Session.connect(conn, Session.serialize(root));
    return next.push().then(() => {
      expect(written.length).to.equal(1);
      expect(written[0].changes).to.deep.equal(
        new Replace(new Null(), new Text("hello"))
      );
    });
  });

  it("removes acked ops from pending", () => {
    let written = null;
    let resolve = null;
    let ver = 0;
    const conn = {
      read() {
        if (written) {
          const ops = written;
          written = null;
          for (let kk = 0; kk < ops.length; kk++) {
            const op = ops[kk];
            ops[kk] = new Operation(
              op.id,
              op.parentId,
              ver,
              op.basis,
              op.changes
            );
            ver++;
          }
          return Promise.resolve(ops);
        }
        return Promise.resolve(null);
      },
      write(ops) {
        written = ops.slice(0);
        return Promise.resolve(null);
      }
    };

    const root = Session.connect(conn);
    root.replace(new Text("hello"));
    expect(written).to.equal(null);

    // push + pull once
    return root
      .push()
      .then(() => root.pull())
      .then(() => root.pull())
      .then(() => {
        root.latest().replace(new Text("world"));
        // push but do not pull yet
        return root.push();
      })
      .then(() => {
        expect(written.length).to.equal(1);
        expect(written[0].basis).to.equal(0);
        expect(written[0].parentId).to.equal(null);
        expect(written[0].changes).to.deep.equal(
          new Replace(new Text("hello"), new Text("world"))
        );

        written = null;
        // restart session from this state and push again
        const next = Session.connect(conn, Session.serialize(root));
        return next.push();
      })
      .then(() => {
        expect(written.length).to.equal(1);
        expect(written[0].changes).to.deep.equal(
          new Replace(new Text("hello"), new Text("world"))
        );
      });
  });

  it("properly merges received ops", () => {
    let written = null;
    const splice = new Splice(0, new Text(""), new Text("OK, "));
    let read = [new Operation("one", null, 0, -1, splice)];
    const conn = {
      read() {
        const ops = read;
        read = null;
        return Promise.resolve(ops);
      },
      write(ops) {
        written = ops;
        return Promise.resolve(null);
      }
    };

    const initial = Session.serialize(new Text("hello"));
    const root = Session.connect(conn, initial);
    root.splice(5, 0, new Text(" world"));

    return root
      .pull()
      .then(() => root.pull())
      .then(() => root.push())
      .then(() => {
        expect(written.length).to.equal(1);
        expect(written[0].basis).to.equal(0);
        expect(written[0].changes.offset).to.equal(9);
      });
  });

  it("properly updated pending and merge with received ops", () => {
    let written = null;
    const splice = new Splice(0, new Text(""), new Text("OK, "));
    let read = [new Operation("one", null, 0, -1, splice)];
    const conn = {
      read() {
        const ops = read;
        read = null;
        return Promise.resolve(ops);
      },
      write(ops) {
        written = ops;
        return Promise.resolve(null);
      }
    };

    const initial = Session.serialize(new Text("hello"));
    const root = Session.connect(conn, initial);
    root.splice(5, 0, new Text(" world"));

    const defer = root.push().then(() => root.pull());
    let next = null;
    return defer
      .then(() => root.pull())
      .then(() => {
        expect(written.length).to.equal(1);
        expect(written[0].basis).to.equal(-1);
        expect(written[0].changes.offset).to.equal(5);

        next = Session.connect(conn, Session.serialize(root));
        read = written;
        written[0].version = 1;
        written = null;
        return next.push();
      })
      .then(() => {
        expect(written.length).to.equal(1);
        expect(written[0].basis).to.equal(-1);
        expect(written[0].changes.offset).to.equal(5);
        return next.pull().then(() => next.pull());
      })
      .then(() => {
        const info = Session.serialize(next);
        expect(info.merge).to.deep.equal([]);
      });
  });
});
