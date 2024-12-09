import { PlaintextLiteral } from "./literal";
import { PlaintextStruct } from "./struct";

export type PlaintextArray = PlaintextLiteral[] | PlaintextStruct[] | PlaintextArray[];