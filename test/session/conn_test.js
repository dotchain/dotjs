// Copyright (C) 2019 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import { Conn, Operation, Replace, Atomic, encode } from "../../index.js";
import { FakeDecoder } from "../core/decoder_test.js";
import { expectGoldenFile } from "./golden.js";

describe("Conn - write", () => {
  it("should write ops", () => {
    let req = null;
    const fetch = (url, opts) => {
      req = { url, opts };
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({ "ops/nw.response": [null, null] });
        }
      });
    };

    const conn = new Conn("some url", fetch, new FakeDecoder());
    return conn.write(getSampleOps()).then(x => {
      expect(x).to.equal(null);
      return expectGoldenFile("request-append.js", req);
    });
  });

  it("should throw errors", () => {
    const fetch = () => {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({
            "ops/nw.response": [null, { "ops/nw.strError": "booya" }]
          });
        }
      });
    };

    const conn = new Conn("some url", fetch, new FakeDecoder());
    return conn.write(getSampleOps()).catch(x => {
      return expect(x.toString()).to.deep.equal(new Error("booya").toString());
    });
  });

  it("should throw network errors", () => {
    const fetch = () => {
      return Promise.reject(new Error("booya"));
    };

    const conn = new Conn("some url", fetch, new FakeDecoder());
    return conn.write(getSampleOps()).catch(x => {
      expect(x.toString()).to.deep.equal(new Error("booya").toString());
    });
  });
});

describe("Conn - read", () => {
  it("should read ops", () => {
    let req = null;
    const fetch = (url, opts) => {
      req = { url, opts };
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({
            "ops/nw.response": [getSampleEncodedOps(), null]
          });
        }
      });
    };

    const conn = new Conn("some url", fetch, new FakeDecoder());
    return conn.read(10, 1000).then(ops => {
      expect(ops).to.deep.equal(getSampleOps());
      return expectGoldenFile("request-getSince.js", req);
    });
  });

  it("should throw errors", () => {
    const fetch = () => {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({
            "ops/nw.response": [null, { "ops/nw.strError": "booya" }]
          });
        }
      });
    };

    const conn = new Conn("some url", fetch, new FakeDecoder());
    return conn.read(10, 1000).catch(x => {
      expect(x.toString()).to.deep.equal(new Error("booya").toString());
    });
  });

  it("should throw network errors", () => {
    const fetch = () => {
      return Promise.reject(new Error("booya"));
    };

    const conn = new Conn("some url", fetch, new FakeDecoder());
    return conn.read(10, 1000).catch(x => {
      expect(x.toString()).to.deep.equal(new Error("booya").toString());
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

function getSampleEncodedOps() {
  const replace = new Replace(new Atomic(1), new Atomic(2));
  return JSON.parse(
    JSON.stringify([
      encode(new Operation("id", "parentId", 10, 100, replace)),
      encode(new Operation("id2", "parentId2", 11, 101, replace))
    ])
  );
}
