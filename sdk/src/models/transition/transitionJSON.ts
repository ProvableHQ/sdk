import { InputJSON } from "../input/inputJSON.js";
import { OutputJSON } from "../output/outputJSON.js";

export interface TransitionJSON {
    id: string;
    program: string;
    function: string;
    inputs?: InputJSON[];
    outputs?: OutputJSON[];
    proof: string;
    tpk: string;
    tcm: string;
    fee: bigint;
}
