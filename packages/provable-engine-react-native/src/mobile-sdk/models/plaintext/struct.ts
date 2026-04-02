import type { PlaintextArray } from "./array.ts";
import type { PlaintextLiteral } from "./literal.ts";

export type PlaintextStruct = {
  [key: string]: PlaintextArray | PlaintextLiteral | PlaintextStruct;
};
