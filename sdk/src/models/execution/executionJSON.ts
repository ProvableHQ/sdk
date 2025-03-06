import { TransitionJSON } from "../transition/transitionJSON";

export interface ExecutionJSON {
    transitions: TransitionJSON[];
    proof: string;
    global_state_root: string;
}

export interface FeeExecutionJSON {
    transition: TransitionJSON;
    proof: string;
    global_state_root: string;
}