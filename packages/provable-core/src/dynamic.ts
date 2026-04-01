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
export const NetworkRecordProvider = native.NetworkRecordProvider;
export const OfflineKeyProvider = native.OfflineKeyProvider;
export const OfflineSearchParams = native.OfflineSearchParams;
export const ProgramManager = native.ProgramManager;
export const verifyBatchProof = native.verifyBatchProof;
export const verifyProof = native.verifyProof;
