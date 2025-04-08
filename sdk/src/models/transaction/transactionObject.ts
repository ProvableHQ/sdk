import { DeploymentObject } from "../deployment/deploymentObject";
import { ExecutionObject, FeeExecutionObject } from "../execution/executionObject";
import { OwnerObject } from "../owner/ownerObject";

export interface TransactionObject {
    type : string;
    id : string;
    execution?: ExecutionObject;
    deployment? : DeploymentObject;
    fee: FeeExecutionObject;
    owner?: OwnerObject;
    feeAmount? : bigint;
    baseFee? : bigint;
    priorityFee? : bigint;
}
