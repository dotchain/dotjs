// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateRetry is a builder for the Backoff class. It only consumes
// the Timer service.
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateRetry(services) {
    const defaultOptions = {
        maxInterval: 2 * 60 * 1000,
        successThresholdInterval: 1 * 60 * 1000,
        resetThresholdInterval: 2 * 60 * 1000,
        startInterval: 2 * 1000,
        baseIncrement: 2 * 1000,
    };

    return class Retry {
        constructor(fn, options) {
            this._timer = new services.Timer(fn);
            this._options = {};
            this._lastReset = 0;
            this._lastError = 0;
            this._lastDuration = 0;
            this._retry = 0;
            const opts = options || {};
            for (let key in defaultOptions) {
                this._options[key] = (key in opts) ? opts[key] : defaultOptions[key];
            }
        }

        retry() {
            const now = this._timer.now();
            const wasReset = this._lastReset > this._lastError;
            const resetLongEnough = this._lastReset + this._options.successThresholdInterval < now;
            const veryOldError = this._lastError + this._options.resetThresholdInterval < now;
            
            if (wasReset ? resetLongEnough : veryOldError) {
                this._retry = 0;
            }
            const start = this._options.startInterval;
            let increment = 0;
            for (let kk = 0; kk < this._retry && start + increment < this._options.maxInterval; kk ++) {
                if (increment === 0) {
                    increment = this._options.BaseIncrement;
                } else {
                    increment = increment * 2
                }
            }
            if (start + increment > this._options.maxInterval) {
                increment = this._options.maxInterval - start;
            }
            this._retry++;
            this._lastError = now;
            this._lastDuration = services.Random.number(start + increment);
            this._timer.defer(this._lastDuration);
        }

        reset() {
            this._timer.reset();
            this._lastReset = this._timer.now();
        }
    }
}
