import {expect} from "chai";
import {field, Dict, Ref, Store, Stream, Text} from "dotjs/db";
describe("Ref", () => {
  it("should evaluate references", ()=> {
    const store = new Store().setStream(new Stream);
    const table1 = store.get("table1");
    const row1 = table1.get("row1").replace(new Dict({
      "hello": new Text("world")
    }))
    const ref = new Ref(["table1", "row1"])

    const hello = field(store, ref, new Text("hello"));
    expect(hello.latest().text).to.equal("world");
  });
});
