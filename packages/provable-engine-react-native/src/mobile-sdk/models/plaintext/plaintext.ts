import type { Plaintext } from "../../wasm.ts";
import type { PlaintextArray } from "./array.ts";
import type { PlaintextLiteral } from "./literal.ts";
import type { PlaintextStruct } from "./struct.ts";

export type PlaintextObject = PlaintextArray | PlaintextLiteral | PlaintextStruct | Plaintext;
