// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

'use strict';

// CreateModelUrl is a builder for the ModelUrl service
//
// All builders take one parameter which is a map of services. This is
// the dependency injection mechanism.  Builder must return a class.
// Code that runs directly in the builder must not access any fields
// of the builder (so it is not possible to extend builder classes)
// but code within the class (such as the class constructor) can
// safely acess the services.
export function CreateModelUrl() {
    return class ModelUrl {
        static parse(url) {
            const parts = url.split('#');
            const pathParts = parts[0].split("/");
            const modelID = pathParts[pathParts.length-1];
            const wsUrl = pathParts.slice(0, -1).join('/')
                  .replace(/^https/i, "wss")
                  .replace(/^http/i, "ws");
            return {wsUrl, modelID, path: (parts[1] || "").split("/")};
        }        
    }
}

