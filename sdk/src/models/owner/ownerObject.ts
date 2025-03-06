import { Address, Signature } from "../../wasm";

export interface OwnerObject {
    address: string | Address;
    signature: string | Signature;
}