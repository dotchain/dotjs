// Karma configuration
// Generated on Fri Apr 26 2019 00:09:58 GMT-0700 (Pacific Daylight Time)

"use strict";

function createChaiPreprocessor(logger) {
  return function(content, file, done) {
    logger
      .create("preprocessor.chaies6")
      .debug('Processing "%s".', file.originalPath);
    content = content.replace(
      'import { expect } from "chai";',
      "const {expect} = window.chai;"
    );
    done(null, content);
  };
}

createChaiPreprocessor.$inject = ["logger"];

module.exports = function(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "chai"],

    // list of files / patterns to load in the browser
    files: [
      { pattern: "index.js", type: "module" },
      { pattern: "core/**/*.js", type: "module" },
      { pattern: "streams/**/*.js", type: "module" },
      { pattern: "session/**/*.js", type: "module" },
      { pattern: "test/core/*.js", type: "module" },
      { pattern: "test/streams/*.js", type: "module" },
      { pattern: "test/session/*.js", type: "module" }
    ],

    plugins: [
      "karma-chrome-launcher",
      "karma-chai",
      "karma-mocha",
      "karma-mocha-reporter",
      { "preprocessor:chaies6": ["factory", createChaiPreprocessor] }
    ],

    // list of files / patterns to exclude
    exclude: ["test/session/conn_test.js", "test/session/golden.js"],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "test/**/*.js": ["chaies6"]
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
    browsers: ["Chrome"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
