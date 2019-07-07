import {expect} from "chai";
import {Stream, Text} from "dotjs/db";
describe("Convergence", () => {
  it("should converge", ()=> {
    const initial = new Text("hello").setStream(new Stream());
    const updated1 = initial.splice(5, 0, " world");
    const updated2 = initial.splice(5, 0, ", goodbye!")

    expect(initial.text).to.equal("hello");
    expect(updated1.text).to.equal("hello world");
    expect(updated2.text).to.equal("hello, goodbye!");

    expect(initial.latest().text).equal("hello world, goodbye!")
    expect(updated1.latest().text).equal("hello world, goodbye!")
    expect(updated2.latest().text).equal("hello world, goodbye!")
  });
});
