// Karma configuration
// Generated on Fri Apr 26 2019 00:09:58 GMT-0700 (Pacific Daylight Time)

"use strict";

function mungeFactory(logger) {
  return function(content, file, done) {
    logger
      .create("preprocessor.munge-es6-imports")
      .debug('Processing "%s".', file.originalPath);
    content = content.replace(
      'import { expect } from "chai";',
      "const {expect} = window.chai;"
    );
    content = content.replace(
      'import { dirname } from "path";',
      'const dirname = e => ".";'
    );

    done(null, content);
  };
}

mungeFactory.$inject = ["logger"];

module.exports = function(config) {
  let modules = [
    { pattern: "*.js", type: "module" },
    { pattern: "test/*.js", type: "module" },
    { pattern: "test/testdata/*.js", type: "module" }
  ];

  if (config.e2e) {
    //    require("esm")(module)("./test/e2e/server.js");
    //    modules.push({ pattern: "test/e2e/*.js", type: "module" });
  }

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "chai"],

    // list of files / patterns to load in the browser
    files: modules,

    plugins: [
      "karma-chrome-launcher",
      "karma-chai",
      "karma-mocha",
      "karma-mocha-reporter",
      { "preprocessor:munge-es6-imports": ["factory", mungeFactory] }
    ],

    // list of files / patterns to exclude
    exclude: ["esmloader.js"],
    //  exclude: config.e2e ? ["test/e2e/server.js"] : [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "test/*.js": ["munge-es6-imports"]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["mocha"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["ChromeHeadless"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
