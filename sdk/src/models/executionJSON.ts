import { TransitionJSON } from "./transition/transitionJSON";

export type ExecutionJSON = {
    edition: number;
    transitions?: (TransitionJSON)[];
}
