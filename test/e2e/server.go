// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

// main implements a simple demo server
package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/dotchain/dot/ops"
	"github.com/dotchain/dot/ops/nw"
	"github.com/dotchain/dot/test/testops"
	"github.com/rs/cors"
)

// mux simply creates a store as needed
type mux struct {
	handlers map[string]*nw.Handler
	sync.Mutex
}

func (m *mux) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/dotjs/")

	m.Lock()
	if _, ok := m.handlers[id]; !ok {
		l := log.New(os.Stdout, "["+id+"] ", 0)
		store := ops.Polled(testops.MemStore(nil))
		m.handlers[id] = &nw.Handler{Store: store, Log: l}
	}
	h := m.handlers[id]
	m.Unlock()

	h.ServeHTTP(w, r)
}

func main() {
	server := &mux{handlers: map[string]*nw.Handler{}}
	http.Handle("/dotjs/", cors.Default().Handler(server))
	http.ListenAndServe(":8089", nil)
}
