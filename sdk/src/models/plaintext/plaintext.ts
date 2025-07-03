import { Plaintext } from "../../wasm.js";
import { PlaintextArray } from "./array.js";
import { PlaintextLiteral } from "./literal.js";
import { PlaintextStruct } from "./struct.js";

export type PlaintextObject = PlaintextArray| PlaintextLiteral | PlaintextStruct | Plaintext;
