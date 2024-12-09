import { VerifyingKey } from "@provablehq/wasm";

export type FunctionObject = {
    "name" : string,
    "constraints" : number,
    "variables" : number,
    "verifyingKey" : string | VerifyingKey,
}