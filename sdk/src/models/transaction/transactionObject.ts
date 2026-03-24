import { DeploymentObject } from "../deployment/deploymentObject.js";
import {
    ExecutionObject,
    FeeExecutionObject,
} from "../execution/executionObject.js";
import { OwnerObject } from "../owner/ownerObject.js";

export interface TransactionObject {
    type: string;
    id: string;
    execution?: ExecutionObject;
    deployment?: DeploymentObject;
    fee: FeeExecutionObject;
    owner?: OwnerObject;
    feeAmount?: bigint;
    baseFee?: bigint;
    priorityFee?: bigint;
}
