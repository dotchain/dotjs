import {expect} from "chai";
import {Stream, Text} from "dotjs/db";
describe("Stream", () => {
  it("should stream changes", ()=> {
    const initial = new Text("hello").setStream(new Stream());

    initial.splice(0, 1, "H"); // hello => Hello
    initial.splice(5, 0, " world.") // Hello => Hello world.

    // get next versions
    const {change, version} = initial.next;
    const {change: c2, version: final} = version.next;

    expect(final.text).to.equal("Hello world.");

    // change = Splice {
    //   offset: 0,
    //   before: Text("h"),
    //   after: Text("H")
    // }
    // c2 = Splice {
    //   offset: 5,
    //   before: Text(""),
    //   after: Text(" world.")
    // }
    console.log(change, c2);
  });
});
