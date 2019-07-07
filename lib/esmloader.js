// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

// This is a legacy loader for systems that do not have
// ES6 module loading support.
module.exports = require("esm")(module)("./index.js");
