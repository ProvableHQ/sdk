import { TransitionObject } from "../transition/transitionObject";
import { DeploymentMetadata } from "../deploy";

export interface TransactionObject {
    id : string;
    type : string;
    fee : bigint;
    baseFee : bigint;
    priorityFee : bigint;
    transitions : TransitionObject[];
    deployment?: DeploymentMetadata;
}
