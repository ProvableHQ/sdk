import { DeploymentJSON } from "../deployment/deploymentJSON";
import { ExecutionJSON } from "../executionJSON";
import { FeeJSON } from "../feeJSON";
import { OwnerJSON } from "../ownerJSON";

export interface TransactionJSON {
    type: string;
    id: string;
    deployment?: DeploymentJSON;
    execution?: ExecutionJSON;
    fee: FeeJSON;
    owner?: OwnerJSON;
}