import { TransitionJSON } from "./transition/transitionJSON";

export interface FeeJSON {
    transition: TransitionJSON;
    global_state_root: string;
    proof: string;
}