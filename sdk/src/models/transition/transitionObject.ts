import { InputObject } from "../input/inputObject.js";
import { OutputObject } from "../output/outputObject.js";
import { Field, Group } from "../../wasm.js";

export interface TransitionObject {
    id: string;
    program: string;
    function: string;
    inputs?: InputObject[];
    outputs?: OutputObject[];
    proof: string;
    tpk: string | Group;
    tcm: string | Field;
    scm: string | Field;
    fee: bigint;
}
