import { BHP256, Plaintext, Scalar } from "../../wasm.js";

// This method generates the hook data for the Circle USDCx shielded mint flow.  
function generateHookData(recipientAddress: String, secretNonce: String): Uint8Array {
  // Leo's BHP256::commit_to_field uses the typed plaintext bits, not raw address bits.
  const recipientBits = Plaintext.fromString(recipientAddress).toBitsLe();
  const secret = Scalar.fromString(secretNonce);
  const committedField = new BHP256().commit(recipientBits, secret);
  const committedBytes = committedField.toBytesLe();

  const hookData = new Uint8Array(65);
  hookData[0] = 2;
  hookData.set(committedBytes, 1);
  return hookData;
}

export { generateHookData };