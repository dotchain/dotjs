import {expect} from "chai";
import {Text} from "dotjs/db";
describe("Functional", () => {
  it("should not mutate underlying value", ()=> {
    const initial = new Text("hello");
    const updated = initial.splice(5, 0, " world");
    expect(initial.text).to.equal("hello");
    expect(updated.text).to.equal("hello world");
  });
});
