import { VerifyingKey } from "../wasm";

export interface FunctionObject {
    "name" : string,
    "constraints" : number,
    "variables" : number,
    "verifyingKey" : string | VerifyingKey,
    "certificate" : string,
}