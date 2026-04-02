import type { Int64 } from "react-native-nitro-modules";
import type { DeploymentObject } from "../deployment/deploymentObject.ts";
import type { ExecutionObject, FeeExecutionObject } from "../execution/executionObject.ts";
import type { OwnerObject } from "../owner/ownerObject.ts";

export interface TransactionObject {
  type: string;
  id: string;
  execution?: ExecutionObject;
  deployment?: DeploymentObject;
  fee: FeeExecutionObject;
  owner?: OwnerObject;
  feeAmount?: Int64;
  baseFee?: Int64;
  priorityFee?: Int64;
}
