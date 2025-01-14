import { InputJSON } from "../input/inputJSON";
import { OutputJSON } from "../output/outputJSON";

export interface TransitionJSON {
    id: string;
    program: string;
    function: string;
    inputs?: (InputJSON)[];
    outputs?: (OutputJSON)[];
    proof: string;
    tpk: string;
    tcm: string;
    fee: bigint;
}