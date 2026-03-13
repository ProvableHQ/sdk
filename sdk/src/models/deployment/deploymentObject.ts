import { FunctionObject } from "../functionObject.js";

export interface DeploymentObject {
    edition: number;
    program: string;
    functions: FunctionObject[];
}
