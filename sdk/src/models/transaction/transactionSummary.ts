import { TransitionObject } from "../transition/transitionObject";
import { DeploymentMetadata } from "../deploy";

export type TransactionSummary = {
    id : string;
    type : string;
    fee : bigint;
    baseFee : bigint;
    priorityFee : bigint;
    transitions : TransitionObject[];
    deployment?: DeploymentMetadata;
}
