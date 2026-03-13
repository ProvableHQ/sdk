import { RequestJSON } from "./request";
import { TransitionJSON } from "./transition/transitionJSON";

export interface AuthorizationJSON {
    requests: RequestJSON[];
    transitions: TransitionJSON[];
}
