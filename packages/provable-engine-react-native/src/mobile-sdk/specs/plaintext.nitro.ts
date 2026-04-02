import type { HybridObject } from "react-native-nitro-modules";

export interface Plaintext extends HybridObject<{ ios: "c++"; android: "c++" }> {
  fromString(value: string): Plaintext;
  fromBytesLe(bytes: ArrayBuffer): Plaintext;
  fromBitsLe(bits: ArrayBuffer): Plaintext;
  fromFields(fields: string[]): Plaintext;
  clone(): Plaintext;
  find(name: string): Plaintext;

  toBytesLe(): ArrayBuffer;
  toBitsLe(): ArrayBuffer;
  toFields(): string[];
  encrypt(address: string, randomizer: string): string;
  encryptSymmetric(transitionViewKey: string): string;
  toObjectZero(): string;
  plaintextType(): string;
}
