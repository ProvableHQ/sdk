/**
 * Core data models for Shield Mobile SDK
 * These interfaces match the structure of the web SDK models
 */

import type { Int64 } from 'react-native-nitro-modules'

/**
 * Input ID identifying the type and unique identifier of an input
 */
export interface InputID {
  type: string;
  id: string;
}

/**
 * Object representation of an Input as raw JSON
 */
export interface InputJSON {
  type: string;
  id: string;
  tag?: string;
  value?: string;
}

/**
 * Object representation of an Output as raw JSON
 */
export interface OutputJSON {
  type: string;
  id: string;
  checksum?: string;
  value: string;
}

/**
 * Request object containing execution details
 */
export interface RequestJSON {
  signer: string;
  network: string;
  program: string;
  method: string;
  input_ids: InputID[];
  inputs: string[];
  signature: string;
  sk_tag: string;
  tvk: string;
  tcm: string;
  scm: string;
}

/**
 * Transition object representing a state transition
 */
export interface TransitionJSON {
  id: string;
  program: string;
  function: string;
  inputs?: InputJSON[];
  outputs?: OutputJSON[];
  proof: string;
  tpk: string;
  tcm: string;
  scm: string;
  fee: Int64;
}

/**
 * Authorization object containing requests and transitions
 */
export interface AuthorizationJSON {
  requests: RequestJSON[];
  transitions: TransitionJSON[];
}

/**
 * Proving request containing authorization and execution details
 */
export interface ProvingRequestJSON {
  authorization: AuthorizationJSON;
  fee_authorization?: AuthorizationJSON;
  broadcast: boolean;
}
