import { PlaintextArray } from "./array";
import { PlaintextLiteral } from "./literal";

export type PlaintextStruct = {
    [key: string]: PlaintextArray | PlaintextLiteral | PlaintextStruct;
}