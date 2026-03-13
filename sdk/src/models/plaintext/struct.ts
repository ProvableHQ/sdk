import { PlaintextArray } from "./array.js";
import { PlaintextLiteral } from "./literal.js";

export type PlaintextStruct = {
    [key: string]: PlaintextArray | PlaintextLiteral | PlaintextStruct;
};
