import type { PlaintextLiteral } from "./literal.ts";
import type { PlaintextStruct } from "./struct.ts";

export type PlaintextArray = PlaintextLiteral[] | PlaintextStruct[] | PlaintextArray[];
