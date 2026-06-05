import { generateHookData } from "../src/integrations/circle/hook-data.ts";
import {SECRET_NONCE, HOOK_DATA_RECIPIENT } from "../src/constants.js";
import { expect } from "chai";

describe("hook-data encoding", () => {
  it("should generate a correct 32 byte encoding and format into 65 byte hook data array", () => {
    // Create hook data for the recipient address and secret nonce
    const hookData = generateHookData(HOOK_DATA_RECIPIENT, SECRET_NONCE);
    expect(hookData.length).to.equal(65);
    expect(hookData[0]).to.equal(2); // Check the first byte is 2
  });
});