import {expect} from "chai";
import {field, Dict, Null, Store, Stream, Text} from "dotjs/db";
describe("Reactive", () => {
  it("fields update with underlying changes", ()=> {
    const initial = new Dict({
      hello: new Text("world")
    }).setStream(new Stream());

    const hello = initial.get("hello");
    initial.get("hello").replace(new Text("goodbye!"));

    expect(hello.latest().text).to.equal("goodbye!");
    expect(initial.latest().get("hello").text).to.equal("goodbye!");
  });

  it("fields update even if the underlying object changes", ()=> {
    const initial = new Text("hello").setStream(new Stream());

    const hello = field(new Store(), initial, new Text("hello"));
    expect(hello).to.be.instanceOf(Null);

    initial.replace(new Dict({hello: new Text("world")}));
    expect(hello.latest().text).to.equal("world");
  });

  it("fields update when the key changes", ()=> {
    const initial = new Dict({
      hello: new Text("world"),
      boo: new Text("hoo")
    }).setStream(new Stream());
    const key = new Text("hello").setStream(new Stream());
    const hello = field(new Store(), initial, key);

    expect(hello.text).to.equal("world");

    key.replace(new Text("boo"));
    expect(hello.latest().text).to.equal("hoo");
  });
});
