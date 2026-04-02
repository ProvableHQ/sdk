import type { TransitionObject } from "../transition/transitionObject.ts";

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
