import type { HybridObject, Int64 } from "react-native-nitro-modules";
import type { PrivateKey, RecordPlaintext, ViewKey } from "./account.nitro";
import type { Authorization } from "./authorization.nitro";
import type { Program as ProgramNitro } from "./program.nitro";
import type { ProvingRequest } from "./proving-request.nitro";
import type { Transaction } from "./transaction.nitro";

// ProgramManager bridge interface - handles program management and transaction building operations
export interface ProgramManager extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Build an authorization for a program function execution
  buildAuthorization(
    programName: string,
    functionName: string,
    inputs: string[],
    privateKey: PrivateKey,
    programSource: string,
    programImports: Record<string, string>,
    edition: number
  ): Authorization;

  // Build a fee authorization for paying transaction fees
  buildFeeAuthorization(
    deploymentOrExecutionId: string,
    baseFeeCredits: Int64,
    priorityFeeCredits: Int64,
    privateKey: PrivateKey,
    feeRecord: string
  ): Authorization;

  // Estimate minimum execution fee (microcredits)
  estimateExecutionFee(
    program: string,
    functionName?: string,
    imports?: Record<string, string>,
    edition?: number
  ): Int64;

  // Estimate minimum execution fee (microcredits)
  estimateFeeForAuthorization(
    programSource: string,
    authorization?: Authorization,
    imports?: Record<string, string>,
    edition?: number
  ): Int64;

  // Build an execution transaction that can be submitted to the network
  buildExecutionTransaction(
    privateKey: PrivateKey,
    program: string,
    functionName: string,
    inputs: string[],
    priorityFee: Int64,
    feeRecord?: RecordPlaintext,
    url?: string,
    imports?: Record<string, string | ProgramNitro>,
    provingKey?: ProvingKey,
    verifyingKey?: VerifyingKey,
    feeProvingKey?: ProvingKey,
    feeVerifyingKey?: VerifyingKey,
    offlineQuery?: OfflineQuery,
    edition?: number
  ): Promise<Transaction>;

  // Estimate minimum deployment fee (microcredits)
  estimateDeploymentFee(programString: string, imports: Record<string, string>): Int64;

  // Build a deployment transaction that can be submitted to the network
  buildDeploymentTransaction(
    privateKey: PrivateKey,
    program: string,
    priorityFee: Int64,
    feeRecord: RecordPlaintext | undefined,
    url: string,
    imports: Record<string, string | ProgramNitro>,
    feeProvingKey: ProvingKey,
    verifyingKey: VerifyingKey,
    offlineQuery?: OfflineQuery
  ): Transaction;

  // Load inclusion prover key to support offline inclusion queries
  loadInclusionProver(provingKey: ProvingKey): void;

  // Compute the commitment for a record plaintext (needed for state path fetching)
  recordPlaintextToCommitment(
    recordPlaintext: string,
    programId: string,
    recordName: string,
    viewKey: ViewKey
  ): string;

  // Compute the serial number for a record plaintext (needed for spent checking)
  recordPlaintextToSerialNumber(
    recordPlaintext: string,
    privateKey: PrivateKey,
    programId: string,
    recordName: string,
    recordViewKey: string
  ): string;

  buildProvingRequest(
    privateKey: PrivateKey,
    program: string,
    functionName: string,
    inputs: string[],
    baseFeeCredits: Int64,
    priorityFeeCredits: Int64,
    feeRecord: undefined | null | RecordPlaintext,
    imports: Record<string, string>,
    broadcast: boolean,
    unchecked: boolean,
    edition: number,
    useFeeMaster: boolean
  ): Promise<ProvingRequest>;
}

export interface ProvingKey extends HybridObject<{ ios: "c++"; android: "c++" }> {
  toBytes(): ArrayBuffer;
  initWithBytes(bytes: ArrayBuffer): void;
  initWithString(key: string): void;
  checksum(): string;
  copy(): ProvingKey;
  // Type checks against credits.aleo metadata JSON
  isBondPublicProver(metadataJson: string): boolean;
  isBondValidatorProver(metadataJson: string): boolean;
  isClaimUnbondPublicProver(metadataJson: string): boolean;
  isFeePrivateProver(metadataJson: string): boolean;
  isFeePublicProver(metadataJson: string): boolean;
  isInclusionProver(metadataJson: string): boolean;
  isJoinProver(metadataJson: string): boolean;
  isSetValidatorStateProver(metadataJson: string): boolean;
  isSplitProver(metadataJson: string): boolean;
  isTransferPrivateProver(metadataJson: string): boolean;
  isTransferPrivateToPublicProver(metadataJson: string): boolean;
  isTransferPublicProver(metadataJson: string): boolean;
  isTransferPublicAsSignerProver(metadataJson: string): boolean;
  isTransferPublicToPrivateProver(metadataJson: string): boolean;
  isUnbondPublicProver(metadataJson: string): boolean;
}

export interface VerifyingKey extends HybridObject<{ ios: "c++"; android: "c++" }> {
  toBytes(): ArrayBuffer;
  initWithBytes(bytes: ArrayBuffer): void;
  initWithString(key: string): void;
  checksum(): string;
  numConstraints(): number;
  copy(): VerifyingKey;
  // Initialize from known credits.aleo verifier keys
  initBondPublicVerifier(): void;
  initBondValidatorVerifier(): void;
  initClaimUnbondPublicVerifier(): void;
  initFeePrivateVerifier(): void;
  initFeePublicVerifier(): void;
  initInclusionVerifier(): void;
  initJoinVerifier(): void;
  initSetValidatorStateVerifier(): void;
  initSplitVerifier(): void;
  initTransferPrivateVerifier(): void;
  initTransferPrivateToPublicVerifier(): void;
  initTransferPublicVerifier(): void;
  initTransferPublicAsSignerVerifier(): void;
  initTransferPublicToPrivateVerifier(): void;
  initUnbondPublicVerifier(): void;
  // Type checks
  isBondPublicVerifier(): boolean;
  isBondValidatorVerifier(): boolean;
  isClaimUnbondPublicVerifier(): boolean;
  isFeePrivateVerifier(): boolean;
  isFeePublicVerifier(): boolean;
  isInclusionVerifier(): boolean;
  isJoinVerifier(): boolean;
  isSetValidatorStateVerifier(): boolean;
  isSplitVerifier(): boolean;
  isTransferPrivateVerifier(): boolean;
  isTransferPrivateToPublicVerifier(): boolean;
  isTransferPublicVerifier(): boolean;
  isTransferPublicAsSignerVerifier(): boolean;
  isTransferPublicToPrivateVerifier(): boolean;
  isUnbondPublicVerifier(): boolean;
}

export interface OfflineQuery extends HybridObject<{ ios: "c++"; android: "c++" }> {
  toBytes(): ArrayBuffer;
  initWithBytes(bytes: ArrayBuffer): void;
  initWithString(json: string): void;
  addBlockHeight(height: number): void;
  addStatePath(commitment: string, statePath: string): void;
}
