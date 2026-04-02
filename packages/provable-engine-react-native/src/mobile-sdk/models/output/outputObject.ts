/**
 * Aleo function Input represented as a typed typescript object.
 */
import type { Field, Plaintext, RecordCiphertext } from "../../wasm.ts";
import type { PlaintextObject } from "../plaintext/plaintext.ts";

/**
 * Object representation of an Input as raw JSON returned from a SnarkOS node.
 */
export interface OutputObject {
  type: string;
  id: string | Field;
  value?: RecordCiphertext | Plaintext | PlaintextObject;
  checksum?: string | Field;
  program?: string;
  function?: string;
  arguments?: Array<Plaintext> | Array<OutputObject>;
}
