import type { HybridObject } from "react-native-nitro-modules";
import type { Field, Field as FieldHybrid } from "./field.nitro";
import type { Group as GroupHybrid } from "./group.nitro";
import type { Plaintext } from "./plaintext.nitro";

// Core value objects that mirror the SDK's WASM types
export interface PrivateKey extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Get a string representation of the private key

  // Get the address corresponding to the private key
  toAddress(): Address;

  // Get the view key corresponding to the private key
  toViewKey(): ViewKey;

  // Get the compute key corresponding to the private key
  toComputeKey(): ComputeKey;

  // Sign a message with the private key
  sign(message: ArrayBuffer): Signature;
}

export interface Address extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Get a string representation of the address

  // Verify a signature against this address
  verify(message: ArrayBuffer, signature: Signature): boolean;
}

export interface ViewKey extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Get a string representation of the view key

  // Get the address corresponding to the view key
  toAddress(): Address;

  // Decrypt a record ciphertext to plaintext
  decrypt(ciphertext: string): RecordPlaintext;

  // Get the fields corresponding to the view key
  toField(): Field;

  // Get the bytes of the view key in little endian format
  toBytesLe(): ArrayBuffer;

  // Get a view key from bytes in little endian format
  fromBytesLe(bytes: ArrayBuffer): ViewKey;
}

export interface ComputeKey {
  name: string;
  asString(): string;
}

export interface Signature {
  name: string;
  asString(): string;
}

export interface RecordCiphertext {
  // Check if the view key owns this record
  isOwner(viewKey: ViewKey): boolean;
  asString(): string;
}

export interface RecordPlaintext {
  name: string;
  asString(): string;
  getMember(input: string): Plaintext;
}

export type { Plaintext };

// Account utilities - hybrid object with all account-related functionality
export interface Account extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // Generate a new private key using a cryptographically secure random number generator
  createPrivateKey(): PrivateKey;

  // Create a private key from a seed
  privateKeyFromSeed(seed: ArrayBuffer): PrivateKey;

  // Get a private key from a string representation
  privateKeyFromString(privateKey: string): PrivateKey;

  // Get an address from a string representation
  addressFromString(address: string): Address;

  // Get a view key from a string representation
  viewKeyFromString(viewKey: string): ViewKey;

  // Get a compute key from a string representation
  computeKeyFromString(computeKey: string): ComputeKey;

  // Get a signature from a string representation
  signatureFromString(signature: string): Signature;

  // Get a record ciphertext from a string representation
  recordCiphertextFromString(ciphertext: string): RecordCiphertext;

  // Get a record plaintext from a string representation
  recordPlaintextFromString(plaintext: string): RecordPlaintext;

  // Generate a record view key for a specific record
  generateRecordViewKey(viewKey: ViewKey, recordCiphertext: RecordCiphertext): FieldHybrid;

  // Generate a transition view key for a specific transition
  generateTransitionViewKey(viewKey: ViewKey, transitionPublicKey: GroupHybrid): FieldHybrid;
}
