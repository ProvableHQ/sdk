import { TransitionObject } from "../transition/transitionObject";

export interface ExecutionObject {
    transitions: TransitionObject[];
    proof: string;
    global_state_root: string;
}

export interface FeeExecutionObject {
    transition: TransitionObject;
    proof: string;
    global_state_root: string;
}
