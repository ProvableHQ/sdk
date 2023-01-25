import { Transition } from "./transition";
export type Execution = {
    edition: number;
    transitions?: (Transition)[];
};
