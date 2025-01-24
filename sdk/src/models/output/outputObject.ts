/**
 * Aleo function Input represented as a typed typescript object.
 */
import { Field, Ciphertext, Plaintext } from "../../wasm";
import { PlaintextObject } from "../plaintext/plaintext";

/**
 * Object representation of an Input as raw JSON returned from a SnarkOS node.
 */
export interface OutputObject {
    type: string,
    id: string | Field,
    value?: Ciphertext | Plaintext | PlaintextObject,
    checksum?: string | Field,
    program?: string,
    function?: string,
    arguments?: Array<Plaintext> | Array<OutputObject>
}