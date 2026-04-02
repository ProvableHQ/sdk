import type { VerifyingKey } from "../verifying-key";

export interface FunctionObject {
  name: string;
  constraints: number;
  variables: number;
  verifyingKey: string | VerifyingKey;
  certificate: string;
}
