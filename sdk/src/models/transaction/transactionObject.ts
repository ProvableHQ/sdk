import { TransitionObject } from "../transition/transitionObject";
import { DeploymentObject } from "../deployment/deploymentObject";

export interface TransactionObject {
    id : string;
    type : string;
    fee : bigint;
    baseFee : bigint;
    priorityFee : bigint;
    transitions : TransitionObject[];
    deployment? : DeploymentObject;
}
