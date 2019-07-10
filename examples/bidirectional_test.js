import {expect} from "chai";
import {field, filter, Bool, Dict, Null, Store, Stream, Text} from "dotjs/db";
import {Value} from "dotjs/db/value.js";

describe("Bi-directional", () => {
  it("proxies edits on fields", () => {
    const initial = new Dict({
      hello: new Text("world")
    }).setStream(new Stream());

    const hello = field(new Store(), initial, new Text("hello"));
    hello.replace(new Text("goodbye!"));

    expect(initial.latest().get("hello").text).to.equal("goodbye!");
  });

  class PrefixMatcher extends Value {
    constructor(prefix) {
      super();
      this.prefix = prefix;
    }

    clone() {
      return new PrefixMatcher(this.prefix);
    }

    invoke(store, args) {
      const it = field(store, args, new Text("it"));
      const text = it && it.text || "";
      const matches = text.startsWith(this.prefix)
      return new Bool(matches);
    }

    toJSON() {
      return this.prefix;
    }

    static typeName() {
      return "custom.PrefixMatcher";
    }

    static decode(decoder, json) {
      return new PrefixMatcher(json)
    }
  }

  it("proxies edits on filtered dictionaraies", () => {
    const initial = new Dict({
      hello: new Text("world"),
      boo: new Text("goop")
    }).setStream(new Stream());
    // see examples/bidirectional_test.js for fn definition
    const fn = new PrefixMatcher("w");
    const filtered = filter(new Store(), initial, fn);

    expect(filtered.get("boo")).to.be.instanceOf(Null);
    expect(filtered.get("hello").text).to.equal("world");

    filtered.get("seven").replace(new Text("wonders"));

    // see update reflected on the underlying dictionary
    expect(initial.latest().get("seven").text).to.equal("wonders");
  });

});
