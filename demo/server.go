// Copyright (C) 2017 Ramesh Vyaghrapuri. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

package main

import (
	"fmt"
	"github.com/dotchain/dot"
	"github.com/dotchain/dots/db/files"
	"github.com/dotchain/dots/log"
	"github.com/dotchain/dots/snapshots"
	"github.com/gorilla/websocket"
	"net/http"
)

func main() {
	snaps := &files.Snapshot{DataSourceName: "./storage/snaps"}
	factory := &snapshots.Factory{Snapshot: snaps, ChunkSize: 10}
	opdb := &files.Storage{DataSourceName: "./storage"}
	useCompression := func(r *http.Request, conn *websocket.Conn) bool {
		return conn.Subprotocol() == "dotlz"
	}
	upgrader := websocket.Upgrader{
		CheckOrigin:  func(_ *http.Request) bool { return true },
		Subprotocols: []string{"dotlz", "dotl"},
	}
	handler := log.New(dot.Transformer{}, opdb, factory)
	handler.Upgrader = &upgrader
	handler.UseCompression = useCompression

	http.Handle("/client/", http.StripPrefix("/client/", http.FileServer(http.Dir("client"))))
	http.Handle("/demo/ux/", http.StripPrefix("/demo/ux/", http.FileServer(http.Dir("demo/ux"))))
	http.Handle("/log", handler)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Got a request")
		http.ServeFile(w, r, "demo/ux/index.html")
	})

	fmt.Println("Open http://localhost:8181/<some_document_id> in your browser!")
	http.ListenAndServe(":8181", nil)
}
