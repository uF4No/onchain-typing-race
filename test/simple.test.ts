import { expect } from "chai";

describe("Basic Test", function () {
  it("Should pass a simple test", function () {
    expect(1 + 1).to.equal(2);
    console.log("Basic test passed!");
  });

  it("Should test string operations", function () {
    const word = "blockchain";
    expect(word.length).to.equal(10);
    expect(word.substring(0, 5)).to.equal("block");
    console.log("String test passed!");
  });
});
