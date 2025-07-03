import { DeploymentJSON } from "../deployment/deploymentJSON.js";
import { ExecutionJSON, FeeExecutionJSON } from "../execution/executionJSON.js";
import { OwnerJSON } from "../owner/ownerJSON.js";

export interface TransactionJSON {
    type: string;
    id: string;
    deployment?: DeploymentJSON;
    execution?: ExecutionJSON;
    fee: FeeExecutionJSON;
    owner?: OwnerJSON;
}
