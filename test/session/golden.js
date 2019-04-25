// Copyright (C) 2019 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import { dirname } from "path";
import { writeFileSync, readFileSync } from "fs";

export function expectGoldenFile(fileName, json) {
  let golden = false;
  for (let arg of process.argv) {
    if (arg.indexOf("--golden") == 0) {
      golden = true;
    }
  }

  const dir = dirname(new URL(import.meta.url).pathname);
  fileName = dir + "/testdata/" + fileName;

  if (golden) {
    writeFileSync(fileName, JSON.stringify(json, null, 2));
  }

  const data = JSON.parse(readFileSync(fileName));
  expect(JSON.parse(JSON.stringify(json))).to.deep.equal(data);
}
