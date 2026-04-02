import type { HybridObject } from "react-native-nitro-modules";
import type { AuthorizationJSON, RequestJSON, TransitionJSON } from "../models/core-models";
import type { Field } from "./field.nitro";

// Request object - represents an execution request
export interface Request {
  // Get a string representation of the request

  // Get the JSON representation of the request
  toJSON(): RequestJSON;

  // Get the signer address
  getSigner(): string;

  // Get the network ID
  getNetwork(): string;

  // Get the program ID
  getProgram(): string;

  // Get the function name
  getMethod(): string;

  // Get the input IDs
  getInputIds(): Array<{ type: string; id: string }>;

  // Get the inputs
  getInputs(): string[];

  // Get the signature
  getSignature(): string;
}

// Transition object - represents a state transition
export interface Transition {
  // Get a string representation of the transition

  // Get the JSON representation of the transition
  toJSON(): TransitionJSON;

  // Get the transition ID
  getId(): string;

  // Get the program ID
  getProgram(): string;

  // Get the function name
  getFunction(): string;

  // Get the proof
  getProof(): string;

  // Get the fee
  getFee(): string;
}

// Authorization bridge interface - handles authorization operations
export interface Authorization extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Returns a new and independent replica of the Authorization
  replicate(): Authorization;

  // Returns the string representation of the Authorization

  // Reconstructs an Authorization object from its string representation
  fromString(authorizationString: string): Authorization;

  // Returns the left-endian byte representation of the Authorization
  toBytesLe(): ArrayBuffer;

  // Creates an authorization object from a left-endian byte representation of an Authorization
  fromBytesLe(bytes: ArrayBuffer): Authorization;

  // Check if an Authorization object is the same as another
  isEqual(other: Authorization): boolean;

  // Returns the number of `Request`s in the Authorization
  len(): number;

  // Return `true` if the Authorization is empty
  isEmpty(): boolean;

  // Returns `true` if the Authorization is for `credits.aleo/fee_private`
  isFeePrivate(): boolean;

  // Returns `true` if the Authorization is for `credits.aleo/fee_public`
  isFeePublic(): boolean;

  // Returns `true` if the Authorization is for `credits.aleo/split`
  isSplit(): boolean;

  // Insert a transition into the Authorization
  insertTransition(transition: Transition): void;

  // Get the transitions in an Authorization
  transitions(): Transition[];

  // Returns the execution ID for the Authorization
  toExecutionId(): Field;

  // Verify the authorization is valid
  verify(): boolean;

  // Get JSON representation of the authorization
  toJSON(): AuthorizationJSON;

  // Get the requests in the authorization
  getRequests(): RequestJSON[];

  // Get the transitions in the authorization
  getTransitions(): TransitionJSON[];

  // Create authorization from requests and transitions
  fromRequestsAndTransitions(requests: RequestJSON[], transitions: TransitionJSON[]): Authorization;
}
