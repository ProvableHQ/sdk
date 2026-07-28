import { expect } from "chai";
import { getMaxProgramImports } from "../src/node.js";

describe("Network limits", () => {
    it("exposes the snarkVM program import limit", () => {
        expect(getMaxProgramImports()).to.equal(64);
    });
});
