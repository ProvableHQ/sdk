import { InputObject } from "../input/inputObject";
import { OutputObject } from "../output/outputObject";
import { Field, Group } from "@provablehq/wasm";

export type TransitionObject = {
    id: string;
    program: string;
    functionName: string;
    inputs?: (InputObject)[];
    outputs?: (OutputObject)[];
    proof: string;
    tpk: string | Group;
    tcm: string | Field;
    scm: string | Field;
    fee: bigint;
}