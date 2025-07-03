/**
 * Aleo function Input represented as a typed typescript object.
 */
import { Ciphertext, Field, Plaintext } from "../../wasm.js";
import { PlaintextObject } from "../plaintext/plaintext.js";

/**
 * Object representation of an Input as raw JSON returned from a SnarkOS node.
 */
export interface InputObject {
    type: "string",
    id: "string" | Field,
    tag?: string | Field,
    value?: Ciphertext | Plaintext | PlaintextObject,
}
