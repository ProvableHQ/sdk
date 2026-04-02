import type { HybridObject } from "react-native-nitro-modules";

// Parsed record ciphertext interface
export interface ParsedRecordCiphertext {
  owner: string;
  data: string;
  nonce: string;
}

// Token registry balance interface
export interface TokenRegistryBalance {
  balance: string;
  tokenId: string;
  programId: string;
}

// Utilities bridge interface - handles utility functions for parsing and data processing
export interface Utilities extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Parse a record ciphertext string into a structured object
  parseRecordCiphertext(recordPlaintext: string): ParsedRecordCiphertext;

  // Parse the native Aleo credit amount from a record plaintext
  parseNativeAmount(plaintext: string): string;

  // Parse a token amount from a record plaintext
  parseTokenAmount(plaintext: string, programId: string, tokenId: string): string;

  // Get the token ID from a record plaintext
  getTokenIdFromRecordPlaintext(plaintext: string, programId: string): string;

  // Construct transaction inputs for various transfer methods
  constructTransactionInputs(
    transferMethod: string,
    programId: string,
    tokenId: string,
    to: string,
    amount: string,
    recordPlaintext: string
  ): string[];

  // Construct split transaction inputs
  constructSplitTxInputs(programId: string, recordPlaintext: string, amount: string): string[];

  // Get a hashed string representation of ID plaintext bits
  getHashedString(idPlaintextBits: string): string;

  // Get the mapping name for a program
  getMappingNameForProgram(programId: string): string;

  // Parse a U128 balance value
  parseU128(balance: string): string;

  // Parse a U64 balance value
  parseU64(balance: string): string;

  // Parse a token registry balance response
  parseTokenRegistryBalance(res: string): TokenRegistryBalance;

  // Verify a mnemonic phrase
  verifyMnemonic(mnemonic: string): boolean;

  // Encrypt bytes with a libsodium sealed box public key (RFC 4648 base64 in/out)
  cryptoBoxSealBase64(publicKeyB64: string, message: ArrayBuffer): string;

  // Decrypt libsodium sealed box bytes (RFC 4648 base64 in, bytes out)
  cryptoBoxSealOpenBase64(
    publicKeyB64: string,
    privateKeyB64: string,
    sealedB64: string
  ): ArrayBuffer;
}
