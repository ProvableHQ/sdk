import { PlaintextLiteral } from "./literal.js";
import { PlaintextStruct } from "./struct.js";

export type PlaintextArray = PlaintextLiteral[] | PlaintextStruct[] | PlaintextArray[];
