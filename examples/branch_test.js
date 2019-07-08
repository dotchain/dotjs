import {expect} from "chai";
import {Stream, Text} from "dotjs/db";
describe("Branch", () => {
  it("should branch and merge", ()=> {
    const parent = new Text("hello").setStream(new Stream());
    const child = parent.branch();

    const child1 = child.splice(5, 0, ", bye!");
    const parent1 = parent.splice(5, 0, " world");

    expect(parent.latest().text).to.equal("hello world");
    expect(child.latest().text).to.equal("hello, bye!");

    child1.push()

    expect(parent.latest().text).to.equal("hello world, bye!");
    expect(child.latest().text).to.equal("hello, bye!");

    child1.pull();

    expect(parent.latest().text).to.equal("hello world, bye!");
    expect(child.latest().text).to.equal("hello world, bye!");
  });
});
