import { DeploymentJSON } from "../deployment/deploymentJSON";
import { ExecutionJSON, FeeExecutionJSON } from "../execution/executionJSON";
import { OwnerJSON } from "../owner/ownerJSON";

export interface TransactionJSON {
    type: string;
    id: string;
    deployment?: DeploymentJSON;
    execution?: ExecutionJSON;
    fee: FeeExecutionJSON;
    owner?: OwnerJSON;
}