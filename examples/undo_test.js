import {expect} from "chai";
import {Session, Stream, Text} from "dotjs/db";
describe("Undo`", () => {
  it("should undo redo", ()=> {
    const parent = new Text("hello").setStream(new Stream);
    const child = Session.undoable(parent);

    child.splice(5, 0, new Text(" world"));
    parent.splice(0, 1, new Text("H"))

    expect(parent.latest().text).to.equal("Hello world");
    expect(child.latest().text).to.equal("Hello world");

    child.undo();
    expect(parent.latest().text).to.equal("Hello");
    expect(child.latest().text).to.equal("Hello");

    child.redo();
    expect(parent.latest().text).to.equal("Hello world");
    expect(child.latest().text).to.equal("Hello world");
  });
});
