import {expect} from "chai";
import {field, run, Dict, Ref, Store, Stream, Text} from "dotjs/db";
import {Reflect} from "dotjs/db/reflect.js";

describe("Reflect", () => {
  it("should persist calculations", ()=> {
    const store = new Store({
      hello: new Dict({
        world: new Text("boo"),
        boo: new Text("hoo")
      }),
      calcs: new Dict()
    }).setStream(new Stream);

    // calc1 = store[hello][store.hello.world]
    // which is store[hello][boo] = hoo
    const calc1 = field(
      store,
      new Ref(["hello"]),
      new Ref(["hello", "world"])
    );
    expect(calc1.text).to.equal("hoo")

    // now persist this calculation
    const def = Reflect.definition(calc1);
    store.get("calcs").get("calc1").replace(def);

    // now updatee store.hello.boo to newhoo
    store.get("hello").get("boo").replace(new Text("newhoo"));

    // validate that the new calc updates
    const s = store.latest();
    const val = run(s, s.get("calcs").get("calc1"));
    expect(val.text).to.equal("newhoo");
  });
});
