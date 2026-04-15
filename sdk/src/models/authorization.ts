import { RequestJSON } from "./request.js";
import { TransitionJSON } from "./transition/transitionJSON.js";

export interface AuthorizationJSON {
    requests: RequestJSON[];
    transitions: TransitionJSON[];
}