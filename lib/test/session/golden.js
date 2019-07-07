// Copyright (C) 2019 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

"use strict";

import { expect } from "chai";
import { dirname } from "path";

export function expectGoldenFile(fileName, json) {
  const dir = dirname(new URL(import.meta.url).pathname);
  fileName = dir + "/testdata/" + fileName;

  if (generateGoldenFile()) {
    return import("fs").then(({ writeFileSync }) => {
      writeFileSync(
        fileName,
        "export default " + JSON.stringify(json, null, 2)
      );
    });
  }

  return import(fileName).then(data => {
    expect(JSON.parse(JSON.stringify(json))).to.deep.equal(data.default);
  });
}

function generateGoldenFile() {
  if (typeof process === "undefined") {
    return false;
  }

  for (let arg of process.argv) {
    if (arg.indexOf("--golden") == 0) {
      return true;
    }
  }
}
