import { Authorization } from "./authorization";
import { getNitroClassNetworkAware } from "./current-network";
import type { ProvingRequestJSON } from "./models/core-models";
import type { ProvingRequest as ProvingRequestNitro } from "./specs/proving-request.nitro.js";

// Lazy initialization for ProvingRequest hybrid object
let _hybridProvingRequest: ProvingRequestNitro | null = null;

function getHybridProvingRequest(): ProvingRequestNitro {
  if (!_hybridProvingRequest) {
    _hybridProvingRequest = getNitroClassNetworkAware<ProvingRequestNitro>("ProvingRequest");
  }
  return _hybridProvingRequest;
}

/**
 * Parameters for creating a ProvingRequest (internal use only)
 */
interface ProvingRequestParams {
  nitroProvingRequest: ProvingRequestNitro;
}

/**
 * ProvingRequest class for submitting Aleo program execution requests in React Native applications.
 *
 * The ProvingRequest class represents a request to execute a function on the Aleo network.
 * It contains an authorization for the main function and optionally a fee authorization
 * for paying execution fees. The broadcast flag indicates whether the proving service
 * should submit the resulting transaction to the network.
 *
 * @example
 * import { ProvingRequest, Authorization } from "@provablehq/shield-mobile-sdk";
 *
 * // Create proving request with authorization
 * const provingRequest = ProvingRequest.new(mainAuthorization, feeAuthorization, true);
 *
 * // Create proving request from string
 * const provingRequest = ProvingRequest.fromString("provingrequest1...");
 *
 * // Get string representation
 * const requestString = provingRequest.toString();
 */
export class ProvingRequest {
  public _nitroProvingRequest: ProvingRequestNitro;

  constructor(params: ProvingRequestParams) {
    this._nitroProvingRequest = params.nitroProvingRequest;
  }

  /**
   * Creates a string representation of the ProvingRequest.
   * @returns {string} The string representation of the proving request
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const requestString = provingRequest.toString();
   */
  toString(): string {
    return this._nitroProvingRequest.toString();
  }

  /**
   * Creates a left-endian byte representation of the ProvingRequest.
   * @returns {Uint8Array} The byte representation of the proving request
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const requestBytes = provingRequest.toBytesLe();
   */
  toBytesLe(): ArrayBuffer {
    return this._nitroProvingRequest.toBytesLe();
  }

  /**
   * Returns the JSON representation of the ProvingRequest.
   * @returns {ProvingRequestJSON} The JSON representation of the proving request
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const requestJSON = provingRequest.toJSON();
   */
  toJSON(): ProvingRequestJSON {
    return this._nitroProvingRequest.toJSON();
  }

  /**
   * Get the Authorization of the main function in the ProvingRequest.
   * @returns {Authorization} The main authorization
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const authorization = provingRequest.authorization();
   */
  authorization(): Authorization {
    const authorizationNitro = this._nitroProvingRequest.authorization();
    return new Authorization({ nitroAuthorization: authorizationNitro });
  }

  /**
   * Get the fee Authorization in the ProvingRequest.
   * @returns {Authorization | undefined} The fee authorization or undefined
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const feeAuthorization = provingRequest.feeAuthorization();
   */
  feeAuthorization(): Authorization | null {
    const feeAuthorizationNitro = this._nitroProvingRequest.feeAuthorization();
    if (!feeAuthorizationNitro) {
      return null;
    }
    return new Authorization({ nitroAuthorization: feeAuthorizationNitro });
  }

  /**
   * Get the broadcast flag set in the ProvingRequest.
   * @returns {boolean} True if the request should be broadcast
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const shouldBroadcast = provingRequest.broadcast();
   */
  broadcast(): boolean {
    return this._nitroProvingRequest.broadcast();
  }

  /**
   * Deep clones the ProvingRequest.
   * @returns {ProvingRequest} A new ProvingRequest instance with the same data
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const clonedRequest = provingRequest.clone();
   */
  clone(): ProvingRequest {
    const replicatedNitro = this._nitroProvingRequest.replicate();
    return new ProvingRequest({ nitroProvingRequest: replicatedNitro });
  }

  /**
   * Verifies the ProvingRequest is valid.
   * @returns {boolean} True if the proving request is valid
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const isValid = provingRequest.verify();
   */
  verify(): boolean {
    return this._nitroProvingRequest.verify();
  }

  /**
   * Creates a replicated copy of the ProvingRequest.
   * @returns {ProvingRequest} A new ProvingRequest instance that replicates this one
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   * const replicatedRequest = provingRequest.replicate();
   */
  replicate(): ProvingRequest {
    const replicatedNitro = this._nitroProvingRequest.replicate();
    return new ProvingRequest({ nitroProvingRequest: replicatedNitro });
  }

  /**
   * Check if a ProvingRequest is the same as another ProvingRequest.
   * @param {ProvingRequest} other The ProvingRequest object to determine equality with
   * @returns {boolean} True if the proving requests are equal
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const request1 = ProvingRequest.fromString("provingrequest1...");
   * const request2 = ProvingRequest.fromString("provingrequest1...");
   * const areEqual = request1.equals(request2);
   */
  equals(other: ProvingRequest): boolean {
    return this._nitroProvingRequest.isEqual(other._nitroProvingRequest);
  }

  /**
   * Creates a new ProvingRequest from a function Authorization and an optional fee Authorization.
   * @param {Authorization} authorization An Authorization for a function
   * @param {Authorization | null | undefined} feeAuthorization The authorization for the fee function (optional)
   * @param {boolean} broadcast Flag that indicates whether the remote proving service should attempt to submit the transaction
   * @returns {ProvingRequest} A new ProvingRequest instance
   *
   * @example
   * import { ProvingRequest, Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.new(authorization, feeAuthorization, true);
   */
  static new(
    authorization: Authorization,
    feeAuthorization: Authorization | null | undefined,
    broadcast: boolean
  ): ProvingRequest {
    try {
      const hybridProvingRequest = getHybridProvingRequest();
      const feeAuthorizationNitro = feeAuthorization?._nitroAuthorization ?? undefined;
      const result = hybridProvingRequest.create(
        authorization._nitroAuthorization,
        feeAuthorizationNitro,
        broadcast
      );
      return new ProvingRequest({ nitroProvingRequest: result });
    } catch (e) {
      throw new Error(`ProvingRequest.new(...): ${(e as Error).message}`);
    }
  }

  /**
   * Creates a ProvingRequest from a string representation.
   * @param {string} provingRequestString The string representation of the proving request
   * @returns {ProvingRequest} A ProvingRequest instance
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromString("provingrequest1...");
   */
  static fromString(provingRequestString: string): ProvingRequest {
    try {
      const result = getHybridProvingRequest().fromString(provingRequestString);
      return new ProvingRequest({ nitroProvingRequest: result });
    } catch (e) {
      throw new Error(`ProvingRequest.fromString(...): ${(e as Error).message}`);
    }
  }

  /**
   * Creates a ProvingRequest from a left-endian byte representation of the ProvingRequest.
   * @param {ArrayBuffer} bytes Left-endian bytes representing the proving request
   * @returns {ProvingRequest} A ProvingRequest instance
   *
   * @example
   * import { ProvingRequest } from "@provablehq/shield-mobile-sdk";
   *
   * const provingRequest = ProvingRequest.fromBytesLe(requestBytes);
   */
  static fromBytesLe(bytes: ArrayBuffer): ProvingRequest {
    try {
      const result = getHybridProvingRequest().fromBytesLe(bytes);
      return new ProvingRequest({ nitroProvingRequest: result });
    } catch (e) {
      throw new Error(`ProvingRequest.fromBytesLe(...): ${(e as Error).message}`);
    }
  }
}
