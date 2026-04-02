import type { DeploymentJSON } from "../deployment/deploymentJSON.ts";
import type { ExecutionJSON, FeeExecutionJSON } from "../execution/executionJSON.ts";
import type { OwnerJSON } from "../owner/ownerJSON.ts";

export interface TransactionJSON {
  type: string;
  id: string;
  deployment?: DeploymentJSON;
  execution?: ExecutionJSON;
  fee: FeeExecutionJSON;
  owner?: OwnerJSON;
}
