import type { HybridObject } from "react-native-nitro-modules";
import type { ProvingRequestJSON } from "../models/core-models";
import type { Authorization } from "./authorization.nitro";

// ProvingRequest bridge interface - handles proving request operations
export interface ProvingRequest extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Creates a new ProvingRequest from a function Authorization and an optional fee Authorization
  create(
    authorization: Authorization,
    feeAuthorization: Authorization | undefined,
    broadcast: boolean
  ): ProvingRequest;

  // Creates a string representation of the ProvingRequest

  // Creates a ProvingRequest from a string representation
  fromString(request: string): ProvingRequest;

  // Creates a left-endian byte representation of the ProvingRequest
  toBytesLe(): ArrayBuffer;

  // Creates a ProvingRequest from a left-endian byte representation of the ProvingRequest
  fromBytesLe(bytes: ArrayBuffer): ProvingRequest;

  // Get the Authorization of the main function in the ProvingRequest
  authorization(): Authorization;

  // Get the fee Authorization in the ProvingRequest
  feeAuthorization(): Authorization | undefined;

  // Get the broadcast flag set in the ProvingRequest
  broadcast(): boolean;

  // Check if a ProvingRequest is the same as another ProvingRequest
  isEqual(other: ProvingRequest): boolean;

  // Verify the proving request is valid
  verify(): boolean;

  // Create a replica of the proving request
  replicate(): ProvingRequest;

  // Get JSON representation of the proving request
  toJSON(): ProvingRequestJSON;
}
