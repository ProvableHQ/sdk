import type { RequestJSON } from "./request";
import type { TransitionJSON } from "./transition/transitionJSON";

export interface AuthorizationJSON {
  requests: RequestJSON[];
  transitions: TransitionJSON[];
}
