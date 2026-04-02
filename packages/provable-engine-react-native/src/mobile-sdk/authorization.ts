import { getNitroClassNetworkAware } from "./current-network";
import { Field } from "./field";
import type { AuthorizationJSON, RequestJSON, TransitionJSON } from "./models/core-models";
import type {
  Authorization as AuthorizationNitro,
  Transition,
} from "./specs/authorization.nitro.js";

// Lazy initialization for Authorization hybrid object
let _hybridAuthorization: AuthorizationNitro | null = null;

function getHybridAuthorization(): AuthorizationNitro {
  if (!_hybridAuthorization) {
    _hybridAuthorization = getNitroClassNetworkAware<AuthorizationNitro>("Authorization");
  }
  return _hybridAuthorization;
}

/**
 * Parameters for creating an Authorization (internal use only)
 */
interface AuthorizationParams {
  nitroAuthorization: AuthorizationNitro;
}

/**
 * Authorization class for Aleo program executions in React Native applications.
 *
 * The Authorization class represents the authorization required to execute a function on the Aleo network.
 * It contains requests and transitions that define the execution and state changes.
 * This class provides methods to create, manipulate, and serialize authorizations.
 *
 * @example
 * import { Authorization } from "@provablehq/shield-mobile-sdk";
 *
 * // Create authorization from execution request
 * const authorization = Authorization.new(executionRequest);
 *
 * // Create authorization from string
 * const authorization = Authorization.fromString("authorization1...");
 *
 * // Get string representation
 * const authString = authorization.toString();
 */
export class Authorization {
  public _nitroAuthorization: AuthorizationNitro;

  constructor(params: AuthorizationParams) {
    this._nitroAuthorization = params.nitroAuthorization;
  }

  /**
   * Returns the string representation of the Authorization.
   * @returns {string} The string representation of the authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const authString = authorization.toString();
   */
  toString(): string {
    return this._nitroAuthorization.toString();
  }

  /**
   * Get the authorization as bytes in little endian format
   * @returns {ArrayBuffer} Byte array representation of the authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const authBytes = authorization.toBytesLe();
   */
  toBytesLe(): ArrayBuffer {
    return this._nitroAuthorization.toBytesLe();
  }

  /**
   * Returns the JSON representation of the Authorization.
   * @returns {AuthorizationJSON} The JSON representation of the authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const authJSON = authorization.toJSON();
   */
  toJSON(): AuthorizationJSON {
    return this._nitroAuthorization.toJSON();
  }

  /**
   * Returns the requests in the Authorization.
   * @returns {RequestJSON[]} The requests in the authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const requests = authorization.getRequests();
   */
  getRequests(): RequestJSON[] {
    return this._nitroAuthorization.getRequests();
  }

  /**
   * Returns the transitions in the Authorization.
   * @returns {TransitionJSON[]} The transitions in the authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const transitions = authorization.getTransitions();
   */
  getTransitions(): TransitionJSON[] {
    return this._nitroAuthorization.getTransitions();
  }

  /**
   * Returns a new and independent replica of the Authorization.
   * @returns {Authorization} A new Authorization instance with the same data
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const replicatedAuthorization = authorization.replicate();
   */
  replicate(): Authorization {
    const replicatedNitro = this._nitroAuthorization.replicate();
    return new Authorization({ nitroAuthorization: replicatedNitro });
  }

  /**
   * Verifies the Authorization is valid.
   * @returns {boolean} True if the authorization is valid
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const isValid = authorization.verify();
   */
  verify(): boolean {
    return this._nitroAuthorization.verify();
  }

  /**
   * Get the transitions in an Authorization.
   * @returns {Transition[]} Array of transition objects
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const transitions = authorization.transitions();
   */
  transitions(): Transition[] {
    return this._nitroAuthorization.transitions();
  }

  /**
   * Check if an Authorization object is the same as another.
   * @param {Authorization} other The Authorization object to determine equality with
   * @returns {boolean} True if the authorizations are equal
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const auth1 = Authorization.fromString("authorization1...");
   * const auth2 = Authorization.fromString("authorization1...");
   * const areEqual = auth1.equals(auth2);
   */
  equals(other: Authorization): boolean {
    return this._nitroAuthorization.isEqual(other._nitroAuthorization);
  }

  /**
   * Returns the number of requests in the Authorization.
   * @returns {number} The number of requests
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const length = authorization.len();
   */
  len(): number {
    return this._nitroAuthorization.len();
  }

  /**
   * Return true if the Authorization is empty.
   * @returns {boolean} True if the authorization is empty
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const empty = authorization.isEmpty();
   */
  isEmpty(): boolean {
    return this._nitroAuthorization.isEmpty();
  }

  /**
   * Returns true if the Authorization is for credits.aleo/fee_private.
   * @returns {boolean} True if this is a fee private authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const isFeePrivate = authorization.isFeePrivate();
   */
  isFeePrivate(): boolean {
    return this._nitroAuthorization.isFeePrivate();
  }

  /**
   * Returns true if the Authorization is for credits.aleo/fee_public.
   * @returns {boolean} True if this is a fee public authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const isFeePublic = authorization.isFeePublic();
   */
  isFeePublic(): boolean {
    return this._nitroAuthorization.isFeePublic();
  }

  /**
   * Returns true if the Authorization is for credits.aleo/split.
   * @returns {boolean} True if this is a split authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const isSplit = authorization.isSplit();
   */
  isSplit(): boolean {
    return this._nitroAuthorization.isSplit();
  }

  /**
   * Insert a transition into the Authorization.
   * @param {Transition} transition The transition object to insert into the Authorization
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * authorization.insertTransition(transition);
   */
  insertTransition(transition: Transition): void {
    this._nitroAuthorization.insertTransition(transition);
  }

  /**
   * Returns the execution ID for the Authorization.
   * @returns {Field} The execution ID for the Authorization, call toString() after this result to get the string representation
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   * const executionId = authorization.toExecutionId();
   */
  toExecutionId(): Field {
    const nitroField = this._nitroAuthorization.toExecutionId();
    return Field.fromNitro(nitroField);
  }

  /**
   * Reconstructs an Authorization object from its string representation.
   * @param {string} authorizationString The string representation of the authorization
   * @returns {Authorization} An Authorization instance
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromString("authorization1...");
   */
  static fromString(authorizationString: string): Authorization {
    try {
      const hybridAuth = getHybridAuthorization();
      const result = hybridAuth.fromString(authorizationString);
      const wrappedAuth = new Authorization({ nitroAuthorization: result });
      return wrappedAuth;
    } catch (e) {
      throw new Error(`Authorization.fromString(...): ${(e as Error).message}`);
    }
  }

  /**
   * Creates an authorization object from a left-endian byte representation of an Authorization.
   * @param {ArrayBuffer} bytes Left-endian bytes representing the Authorization
   * @returns {Authorization} An Authorization instance
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromBytesLe(authBytes);
   */
  static fromBytesLe(bytes: ArrayBuffer): Authorization {
    try {
      const result = getHybridAuthorization().fromBytesLe(bytes);
      return new Authorization({ nitroAuthorization: result });
    } catch (e) {
      throw new Error(`Authorization.fromBytesLe(...): ${(e as Error).message}`);
    }
  }

  /**
   * Creates an Authorization from requests and transitions.
   * @param {RequestJSON[]} requests The requests for the authorization
   * @param {TransitionJSON[]} transitions The transitions for the authorization
   * @returns {Authorization} An Authorization instance
   *
   * @example
   * import { Authorization } from "@provablehq/shield-mobile-sdk";
   *
   * const authorization = Authorization.fromRequestsAndTransitions(requests, transitions);
   */
  static fromRequestsAndTransitions(
    requests: RequestJSON[],
    transitions: TransitionJSON[]
  ): Authorization {
    try {
      const result = getHybridAuthorization().fromRequestsAndTransitions(requests, transitions);
      return new Authorization({ nitroAuthorization: result });
    } catch (e) {
      throw new Error(`Authorization.fromRequestsAndTransitions(...): ${(e as Error).message}`);
    }
  }
}
