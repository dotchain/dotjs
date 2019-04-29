// Copyright (C) 2019 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";

import {
  Conn,
  Server,
  Operation,
  Replace,
  Atomic,
  Encoder,
  Decoder
} from "../../index.js";
import { expectGoldenFile } from "./golden.js";

describe("Conn", () => {
  connTest(fetch => fetch);
});

describe("Server", () => {
  // proxy all fetch calls through a Server object
  connTest(proxyFetch);
});

function connTest(proxy) {
  it("should write ops", () => {
    let req = null;
    const fetch = proxy((url, opts) => {
      req = {
        url,
        opts: Object.assign({}, opts, { body: JSON.parse(opts.body) })
      };
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({ "ops/nw.response": [null, null] });
        }
      });
    });

    const conn = new Conn("some url", fetch, new Decoder());
    return conn.write(getSampleOps()).then(x => {
      expect(x).to.equal(null);
      return expectGoldenFile("request-append.js", req);
    });
  });

  it("should throw write errors", () => {
    const fetch = proxy(() => {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({
            "ops/nw.response": [null, { "ops/nw.strError": "booya" }]
          });
        }
      });
    });

    const conn = new Conn("some url", fetch, new Decoder());
    return conn.write(getSampleOps()).catch(x => {
      return expect(x.toString()).to.deep.equal(new Error("booya").toString());
    });
  });

  it("should throw write network errors", () => {
    const fetch = proxy(() => {
      return Promise.reject(new Error("booya"));
    });

    const conn = new Conn("some url", fetch, new Decoder());
    return conn.write(getSampleOps()).catch(x => {
      expect(x.toString()).to.deep.equal(new Error("booya").toString());
    });
  });

  it("should read ops", () => {
    let req = null;
    const fetch = proxy((url, opts) => {
      req = {
        url,
        opts: Object.assign({}, opts, { body: JSON.parse(opts.body) })
      };
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({
            "ops/nw.response": [getSampleEncodedOps(), null]
          });
        }
      });
    });

    const conn = new Conn("some url", fetch, new Decoder());
    return conn.read(10, 1000).then(ops => {
      expect(ops).to.deep.equal(getSampleOps());
      return expectGoldenFile("request-getSince.js", req);
    });
  });

  it("should throw read errors", () => {
    const fetch = proxy(() => {
      return Promise.resolve({
        ok: true,
        json() {
          return Promise.resolve({
            "ops/nw.response": [null, { "ops/nw.strError": "booya" }]
          });
        }
      });
    });

    const conn = new Conn("some url", fetch, new Decoder());
    return conn.read(10, 1000).catch(x => {
      expect(x.toString()).to.deep.equal(new Error("booya").toString());
    });
  });

  it("should throw read network errors", () => {
    const fetch = proxy(() => {
      return Promise.reject(new Error("booya"));
    });

    const conn = new Conn("some url", fetch, new Decoder());
    return conn.read(10, 1000).catch(x => {
      expect(x.toString()).to.deep.equal(new Error("booya").toString());
    });
  });
}

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
      Encoder.encode(new Operation("id", "parentId", 10, 100, replace)),
      Encoder.encode(new Operation("id2", "parentId2", 11, 101, replace))
    ])
  );
}

// proxyFetch proxies a fetch call via a server
function proxyFetch(fetch) {
  const s = new Server(new Conn("some url", fetch), null);
  return (url, opts) => {
    return new Promise((resolve, reject) => {
      const req = {
        is: ct => ct === opts.headers["Content-Type"].trim(),
        get: ct => opts[ct],
        body: JSON.parse(opts.body)
      };
      const res = {
        write(body) {
          resolve({
            ok: true,
            json: () => JSON.parse(body)
          });
        }
      };
      const next = err => {
        if (err) {
          reject(err);
        }
      };
      s.handle(req, res, next);
    });
  };
}
