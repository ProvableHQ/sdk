import type { HybridObject } from "react-native-nitro-modules";
import type { Field } from "./field.nitro";

// Key pair generation result interface
export interface KeyPairResult {
  privateKey: string;
  publicKey: string;
  address: string;
}

// Crypto bridge interface - handles cryptographic operations including hash functions and key generation
export interface Crypto extends HybridObject<{ ios: "c++"; android: "c++" }> {
  // BHP hash functions
  bhp256Hash(data: ArrayBuffer): string;
  bhp256HashToGroup(data: ArrayBuffer): string;
  bhp256Commit(data: ArrayBuffer, scalar: string): string;
  bhp256CommitToGroup(data: ArrayBuffer, scalar: string): string;
  bhp512Hash(data: ArrayBuffer): string;
  bhp512HashToGroup(data: ArrayBuffer): string;
  bhp512Commit(data: ArrayBuffer, scalar: string): string;
  bhp512CommitToGroup(data: ArrayBuffer, scalar: string): string;
  bhp768Hash(data: ArrayBuffer): string;
  bhp768HashToGroup(data: ArrayBuffer): string;
  bhp768Commit(data: ArrayBuffer, scalar: string): string;
  bhp768CommitToGroup(data: ArrayBuffer, scalar: string): string;
  bhp1024Hash(data: ArrayBuffer): string;
  bhp1024HashToGroup(data: ArrayBuffer): string;
  bhp1024Commit(data: ArrayBuffer, scalar: string): string;
  bhp1024CommitToGroup(data: ArrayBuffer, scalar: string): string;

  // Pedersen hash functions
  pedersen64Hash(data: ArrayBuffer): string;
  pedersen64Commit(bits: ArrayBuffer, scalar: string): string;
  pedersen64CommitToGroup(bits: ArrayBuffer, scalar: string): string;
  pedersen128Hash(data: ArrayBuffer): string;
  pedersen128Commit(bits: ArrayBuffer, scalar: string): string;
  pedersen128CommitToGroup(bits: ArrayBuffer, scalar: string): string;

  // Poseidon hash functions
  poseidon2Hash(fields: string[]): string;
  poseidon2HashToScalar(fields: string[]): string;
  poseidon2HashToGroup(fields: string[]): string;
  poseidon2HashMany(fields: string[], rate: number): string[];
  poseidon4Hash(fields: string[]): Field;
  poseidon4HashToScalar(fields: string[]): string;
  poseidon4HashToGroup(fields: string[]): string;
  poseidon4HashMany(fields: string[], rate: number): string[];
  poseidon8Hash(fields: string[]): string;
  poseidon8HashToScalar(fields: string[]): string;
  poseidon8HashToGroup(fields: string[]): string;
  poseidon8HashMany(fields: string[], rate: number): string[];

  // Key generation functions
  generateKeyPair(): KeyPairResult;
  computeKeyFromPrivateKey(privateKey: string): string;
  graphKeyFromPrivateKey(privateKey: string): string;

  // Mnemonic functions
  verifyMnemonic(mnemonic: string): boolean;
  generateMnemonic(): string;
}
