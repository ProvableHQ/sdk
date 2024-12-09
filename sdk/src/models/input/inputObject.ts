/**
 * Aleo function Input represented as a typed typescript object.
 */
import { Ciphertext, Field } from "@provablehq/wasm";
import { Plaintext } from "@provablehq/wasm/mainnet.js";
import { PlaintextObject } from "../plaintext/plaintext";

/**
 * Object representation of an Input as raw JSON returned from a SnarkOS node.
 */
export type InputObject = {
    type: "string",
    id: "string" | Field,
    tag?: string | Field,
    value?: Ciphertext | Plaintext | PlaintextObject,
}