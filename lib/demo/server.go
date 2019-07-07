// Copyright (C) 2019 rameshvk. All rights reserved.
// Use of this source code is governed by a MIT-style license
// that can be found in the LICENSE file.

// main implements a simple demo server
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/dotchain/dot"
)

func main() {
	// import net/http
	// import github.com/dotchain/dot

	// uses a local-file backed bolt DB backend
	server := dot.BoltServer("demo.bolt")
	server = dot.WithLogger(server, log.New(os.Stdout, "demo", 0))
	http.Handle("/dotjs/", server)
	http.ListenAndServe(":8089", nil)
}
