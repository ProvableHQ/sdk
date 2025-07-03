import { Address, Signature } from "../../wasm.js";

export interface OwnerObject {
    address: string | Address;
    signature: string | Signature;
}
