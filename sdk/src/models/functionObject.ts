import { VerifyingKey } from "../wasm.js";

export interface FunctionObject {
    "name" : string,
    "constraints" : number,
    "variables" : number,
    "verifyingKey" : string | VerifyingKey,
    "certificate" : string,
}
