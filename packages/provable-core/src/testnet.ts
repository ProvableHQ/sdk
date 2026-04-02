import * as wasm from "@provablehq/provable-engine-wasm/testnet.js";
import { createNativeBindings } from "./native-bindings.js";

export * from "@provablehq/provable-engine-wasm/testnet.js";

const native = createNativeBindings(wasm as Record<string, any>, "testnet");

export const Account = native.Account;
export const AleoKeyProvider = native.AleoKeyProvider;
export const AleoKeyProviderParams = native.AleoKeyProviderParams;
export const AleoNetworkClient = native.AleoNetworkClient;
export const CREDITS_PROGRAM_KEYS = native.CREDITS_PROGRAM_KEYS;
export const DynamicRecord = native.DynamicRecord;
export const Int64 = native.Int64;
export const NetworkRecordProvider = native.NetworkRecordProvider;
export const RecordScanner = native.RecordScanner;
export const OfflineKeyProvider = native.OfflineKeyProvider;
export const OfflineSearchParams = native.OfflineSearchParams;
export const ProgramManager = native.ProgramManager;
export const SealanceMerkleTree = native.SealanceMerkleTree;
export const encryptAuthorization = native.encryptAuthorization;
export const encryptProvingRequest = native.encryptProvingRequest;
export const encryptRegistrationRequest = native.encryptRegistrationRequest;
export const parseU128 = native.parseU128;
export const parseU64 = native.parseU64;
export const verifyBatchProof = native.verifyBatchProof;
export const verifyProof = native.verifyProof;
