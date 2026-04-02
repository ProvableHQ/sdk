import type { FunctionObject } from "../functionObject.ts";

export interface DeploymentObject {
  edition: number;
  program: string;
  functions: FunctionObject[];
}
