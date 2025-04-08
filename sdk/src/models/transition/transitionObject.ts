import { InputObject } from "../input/inputObject";
import { OutputObject } from "../output/outputObject";
import { Field, Group } from "../../wasm";

export interface TransitionObject {
    id: string;
    program: string;
    function: string;
    inputs?: (InputObject)[];
    outputs?: (OutputObject)[];
    proof: string;
    tpk: string | Group;
    tcm: string | Field;
    scm: string | Field;
    fee: bigint;
}