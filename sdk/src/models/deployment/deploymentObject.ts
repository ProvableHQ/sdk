import { FunctionObject } from "../functionObject";

export interface DeploymentObject {
    "edition" : number,
    "program" : string,
    "functions" : FunctionObject[],
}