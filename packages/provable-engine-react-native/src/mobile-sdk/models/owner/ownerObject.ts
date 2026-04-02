import type { Signature } from "../../index.ts";
import type { Address } from "../../wasm.ts";

export interface OwnerObject {
  address: string | Address;
  signature: string | Signature;
}
