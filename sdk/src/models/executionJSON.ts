import { TransitionJSON } from "./transition/transitionJSON";

export interface ExecutionJSON {
    edition: number;
    transitions?: (TransitionJSON)[];
}
