import { getNitroClassNetworkAware, type NetworkName } from "./current-network";
import type {
  ParsedRecordCiphertext,
  TokenRegistryBalance,
  Utilities as UtilitiesNitro,
} from "./specs/utilities.nitro";

// Lazy initialization for Utilities hybrid object
let _hybridUtilities: UtilitiesNitro | null = null;

function getHybridUtilities(): UtilitiesNitro {
  if (!_hybridUtilities) {
    _hybridUtilities = getNitroClassNetworkAware<UtilitiesNitro>("Utilities");
  }
  return _hybridUtilities;
}

/**
 * Transfer method types for Aleo transactions
 */
export enum AleoTransferMethod {
  PUBLIC = "public",
  PRIVATE = "private",
  PUBLIC_TO_PRIVATE = "public_to_private",
  PRIVATE_TO_PUBLIC = "private_to_public",
}

/**
 * Options for constructing transaction inputs
 */
export interface TransactionInputOptions {
  /** Transfer method to use */
  transferMethod: AleoTransferMethod;
  /** Program ID for the transaction */
  programId: string;
  /** Token ID (if applicable) */
  tokenId?: string;
  /** Recipient address */
  to: string;
  /** Amount to transfer */
  amount: string;
  /** Record plaintext to use (if applicable) */
  recordPlaintext?: string;
  /** Private key to use for the transaction */
  privateKey?: string;
}

/**
 * Options for constructing split transaction inputs
 */
export interface SplitTransactionInputOptions {
  /** Program ID for the transaction */
  programId: string;
  /** Record plaintext to split */
  recordPlaintext: string;
  /** Amount for the split */
  amount: string;
  /** Private key to use for the transaction */
  privateKey?: string;
}

/**
 * Parse a record ciphertext string into a structured object
 * @param {string} recordPlaintext The record plaintext string to parse
 * @returns {any} Parsed record object
 *
 * @example
 * import { parseRecordCiphertext } from "@provablehq/shield-mobile-sdk";
 *
 * const recordObject = parseRecordCiphertext(recordPlaintext);
 * console.log("Parsed record:", recordObject);
 */
export function parseRecordCiphertext(recordPlaintext: string): ParsedRecordCiphertext {
  try {
    return getHybridUtilities().parseRecordCiphertext(recordPlaintext);
  } catch (e) {
    throw new Error(`parseRecordCiphertext(): ${(e as Error).message}`);
  }
}

/**
 * Parse the native Aleo credit amount from a record plaintext
 * @param {string} plaintext The record plaintext string
 * @returns {string} The native amount as a string
 *
 * @example
 * import { parseNativeAmount } from "@provablehq/shield-mobile-sdk";
 *
 * const amount = parseNativeAmount(recordPlaintext);
 * console.log("Native amount:", amount);
 */
export function parseNativeAmount(plaintext: string): string {
  try {
    return getHybridUtilities().parseNativeAmount(plaintext);
  } catch (e) {
    throw new Error(`parseNativeAmount(): ${(e as Error).message}`);
  }
}

/**
 * Parse a token amount from a record plaintext
 * @param {string} plaintext The record plaintext string
 * @param {string} programId The program ID of the token
 * @param {string} tokenId The token ID
 * @returns {string} The token amount as a string
 *
 * @example
 * import { parseTokenAmount } from "@provablehq/shield-mobile-sdk";
 *
 * const amount = parseTokenAmount(recordPlaintext, "token.aleo", "USDC");
 * console.log("Token amount:", amount);
 */
export function parseTokenAmount(plaintext: string, programId: string, tokenId: string): string {
  try {
    return getHybridUtilities().parseTokenAmount(plaintext, programId, tokenId);
  } catch (e) {
    throw new Error(`parseTokenAmount(): ${(e as Error).message}`);
  }
}

/**
 * Get the token ID from a record plaintext
 * @param {string} plaintext The record plaintext string
 * @param {string} programId The program ID
 * @returns {string} The token ID
 *
 * @example
 * import { getTokenIdFromRecordPlaintext } from "@provablehq/shield-mobile-sdk";
 *
 * const tokenId = getTokenIdFromRecordPlaintext(recordPlaintext, "token.aleo");
 * console.log("Token ID:", tokenId);
 */
export function getTokenIdFromRecordPlaintext(plaintext: string, programId: string): string {
  try {
    return getHybridUtilities().getTokenIdFromRecordPlaintext(plaintext, programId);
  } catch (e) {
    throw new Error(`getTokenIdFromRecordPlaintext(): ${(e as Error).message}`);
  }
}

/**
 * Construct transaction inputs for various transfer methods
 * @param {TransactionInputOptions} options Options for constructing transaction inputs
 * @returns {string[]} Array of transaction input strings
 *
 * @example
 * import { constructTransactionInputs, AleoTransferMethod } from "@provablehq/shield-mobile-sdk";
 *
 * const inputs = constructTransactionInputs({
 *   transferMethod: AleoTransferMethod.PUBLIC,
 *   programId: "credits.aleo",
 *   to: "aleo1...",
 *   amount: "1000000u64"
 * });
 */
export function constructTransactionInputs(options: TransactionInputOptions): string[] {
  try {
    return getHybridUtilities().constructTransactionInputs(
      options.transferMethod,
      options.programId,
      options.tokenId || "",
      options.to,
      options.amount,
      options.recordPlaintext || ""
    );
  } catch (e) {
    throw new Error(`constructTransactionInputs(): ${(e as Error).message}`);
  }
}

/**
 * Construct split transaction inputs
 * @param {SplitTransactionInputOptions} options Options for constructing split transaction inputs
 * @returns {string[]} Array of transaction input strings
 *
 * @example
 * import { constructSplitTxInputs } from "@provablehq/shield-mobile-sdk";
 *
 * const inputs = constructSplitTxInputs({
 *   programId: "credits.aleo",
 *   recordPlaintext: recordPlaintext,
 *   amount: "500000u64"
 * });
 */
export function constructSplitTxInputs(options: SplitTransactionInputOptions): string[] {
  try {
    return getHybridUtilities().constructSplitTxInputs(
      options.programId,
      options.recordPlaintext,
      options.amount
    );
  } catch (e) {
    throw new Error(`constructSplitTxInputs(): ${(e as Error).message}`);
  }
}

/**
 * Get a hashed string representation of ID plaintext bits
 * @param {string} idPlaintextBits The ID plaintext bits
 * @returns {string} The hashed string
 *
 * @example
 * import { getHashedString } from "@provablehq/shield-mobile-sdk";
 *
 * const hash = getHashedString(idPlaintextBits);
 * console.log("Hashed string:", hash);
 */
export function getHashedString(idPlaintextBits: string): string {
  try {
    return getHybridUtilities().getHashedString(idPlaintextBits);
  } catch (e) {
    throw new Error(`getHashedString(): ${(e as Error).message}`);
  }
}

/**
 * Get the mapping name for a program
 * @param {string} programId The program ID
 * @returns {string} The mapping name
 *
 * @example
 * import { getMappingNameForProgram } from "@provablehq/shield-mobile-sdk";
 *
 * const mappingName = getMappingNameForProgram("credits.aleo");
 * console.log("Mapping name:", mappingName);
 */
export function getMappingNameForProgram(programId: string): string {
  try {
    return getHybridUtilities().getMappingNameForProgram(programId);
  } catch (e) {
    throw new Error(`getMappingNameForProgram(): ${(e as Error).message}`);
  }
}

/**
 * Parse a U128 balance value
 * @param {string} balance The balance string to parse
 * @returns {string} The parsed balance
 *
 * @example
 * import { parseU128 } from "@provablehq/shield-mobile-sdk";
 *
 * const parsed = parseU128("1000000000000000000000000000u128");
 * console.log("Parsed U128:", parsed);
 */
export function parseU128(balance: string): string {
  try {
    return getHybridUtilities().parseU128(balance);
  } catch (e) {
    throw new Error(`parseU128(): ${(e as Error).message}`);
  }
}

/**
 * Parse a U64 balance value
 * @param {string} balance The balance string to parse
 * @returns {string} The parsed balance
 *
 * @example
 * import { parseU64 } from "@provablehq/shield-mobile-sdk";
 *
 * const parsed = parseU64("1000000u64");
 * console.log("Parsed U64:", parsed);
 */
export function parseU64(balance: string): string {
  try {
    return getHybridUtilities().parseU64(balance);
  } catch (e) {
    throw new Error(`parseU64(): ${(e as Error).message}`);
  }
}

/**
 * Parse a token registry balance response
 * @param {any} res The token registry response
 * @returns {any} The parsed balance data
 *
 * @example
 * import { parseTokenRegistryBalance } from "@provablehq/shield-mobile-sdk";
 *
 * const balanceData = parseTokenRegistryBalance(registryResponse);
 * console.log("Token balance:", balanceData);
 */
export function parseTokenRegistryBalance(res: Record<string, unknown>): TokenRegistryBalance {
  try {
    return getHybridUtilities().parseTokenRegistryBalance(JSON.stringify(res));
  } catch (e) {
    throw new Error(`parseTokenRegistryBalance(): ${(e as Error).message}`);
  }
}

/**
 * Verify a mnemonic phrase
 * @param {string} mnemonic The mnemonic phrase to verify
 * @returns {boolean} True if the mnemonic is valid
 *
 * @example
 * import { verifyMnemonic } from "@provablehq/shield-mobile-sdk";
 *
 * const isValid = verifyMnemonic("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
 * console.log("Mnemonic is valid:", isValid);
 */
export function verifyMnemonic(mnemonic: string): boolean {
  try {
    return getHybridUtilities().verifyMnemonic(mnemonic);
  } catch (e) {
    throw new Error(`verifyMnemonic(): ${(e as Error).message}`);
  }
}

export function cryptoBoxSealBase64(
  publicKeyB64: string,
  message: Uint8Array | ArrayBuffer
): string {
  try {
    return getHybridUtilities().cryptoBoxSealBase64(publicKeyB64, toAB(message));
  } catch (e) {
    throw new Error(`cryptoBoxSealBase64(): ${(e as Error).message}`);
  }
}

export function cryptoBoxSealOpenBase64(
  publicKeyB64: string,
  privateKeyB64: string,
  sealedB64: string
): ArrayBuffer {
  try {
    return getHybridUtilities().cryptoBoxSealOpenBase64(publicKeyB64, privateKeyB64, sealedB64);
  } catch (e) {
    throw new Error(`cryptoBoxSealOpenBase64(): ${(e as Error).message}`);
  }
}

/**
 * Set the active network for native modules.
 * @param network Network identifier (`mainnet` or `testnet`)
 */
export function setActiveNetworkNative(_network: NetworkName): void {}

/**
 * Get the currently active network from native modules.
 */
export function getActiveNetworkNative(): NetworkName {
  return "mainnet";
}

/**
 * Reset the active network to the default value on native modules.
 */
export function resetActiveNetworkNative(): void {}

export function toAB(message: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (message instanceof Uint8Array) {
    // Create a new ArrayBuffer with only the actual data from the Uint8Array
    // This avoids issues with Uint8Array views that might have different offsets/lengths
    return message.buffer.slice(
      message.byteOffset,
      message.byteOffset + message.byteLength
    ) as ArrayBuffer;
  }
  return message;
}
