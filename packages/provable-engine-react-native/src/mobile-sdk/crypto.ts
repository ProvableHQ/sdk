import { getNitroClassNetworkAware } from "./current-network";
import type { Crypto as CryptoNitro } from "./specs/crypto.nitro";
import { toAB } from "./utilities";
import { Field } from "./wasm";

type BitInput = ArrayLike<number | boolean> | Uint8Array;
type ScalarLike = string | { toString(): string };
type FieldInput = ArrayLike<{ toString(): string } | string>;

type HashManyResult<T> = T[];

let _hybridCrypto: CryptoNitro | null = null;

function getHybridCrypto(): CryptoNitro {
  if (!_hybridCrypto) {
    _hybridCrypto = getNitroClassNetworkAware<CryptoNitro>("Crypto");
  }
  return _hybridCrypto;
}

const toBitArrayBuffer = (input: BitInput): ArrayBuffer => {
  const array = Array.from(input as ArrayLike<number | boolean>);
  const bytes = new Uint8Array(array.length);
  for (let i = 0; i < array.length; i += 1) {
    const value = array[i];
    bytes[i] = value === true ? 1 : value === false ? 0 : Number(value) & 1;
  }
  return toAB(bytes);
};

const normalizeScalar = (scalar: ScalarLike): string =>
  typeof scalar === "string" ? scalar : scalar.toString();

const normalizeFields = (fields: FieldInput): string[] =>
  Array.from(fields as ArrayLike<any>, (field: any) => field?.toString?.() ?? String(field));

class BHPBase {
  protected readonly crypto = getHybridCrypto();

  protected toBits(input: BitInput): ArrayBuffer {
    return toBitArrayBuffer(input);
  }

  protected toScalar(scalar: ScalarLike): string {
    return normalizeScalar(scalar);
  }
}

export class BHP256 extends BHPBase {
  static setup(_domainSeparator: string): BHP256 {
    return new BHP256();
  }

  hash(input: BitInput): string {
    return this.crypto.bhp256Hash(this.toBits(input));
  }

  hashToGroup(input: BitInput): string {
    return this.crypto.bhp256HashToGroup(this.toBits(input));
  }

  commit(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp256Commit(this.toBits(input), this.toScalar(scalar));
  }

  commitToGroup(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp256CommitToGroup(this.toBits(input), this.toScalar(scalar));
  }
}

export class BHP512 extends BHPBase {
  static setup(_domainSeparator: string): BHP512 {
    return new BHP512();
  }

  hash(input: BitInput): string {
    return this.crypto.bhp512Hash(this.toBits(input));
  }

  hashToGroup(input: BitInput): string {
    return this.crypto.bhp512HashToGroup(this.toBits(input));
  }

  commit(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp512Commit(this.toBits(input), this.toScalar(scalar));
  }

  commitToGroup(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp512CommitToGroup(this.toBits(input), this.toScalar(scalar));
  }
}

export class BHP768 extends BHPBase {
  static setup(_domainSeparator: string): BHP768 {
    return new BHP768();
  }

  hash(input: BitInput): string {
    return this.crypto.bhp768Hash(this.toBits(input));
  }

  hashToGroup(input: BitInput): string {
    return this.crypto.bhp768HashToGroup(this.toBits(input));
  }

  commit(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp768Commit(this.toBits(input), this.toScalar(scalar));
  }

  commitToGroup(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp768CommitToGroup(this.toBits(input), this.toScalar(scalar));
  }
}

export class BHP1024 extends BHPBase {
  static setup(_domainSeparator: string): BHP1024 {
    return new BHP1024();
  }

  hash(input: BitInput): string {
    return this.crypto.bhp1024Hash(this.toBits(input));
  }

  hashToGroup(input: BitInput): string {
    return this.crypto.bhp1024HashToGroup(this.toBits(input));
  }

  commit(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp1024Commit(this.toBits(input), this.toScalar(scalar));
  }

  commitToGroup(input: BitInput, scalar: ScalarLike): string {
    return this.crypto.bhp1024CommitToGroup(this.toBits(input), this.toScalar(scalar));
  }
}

export class Pedersen64 extends BHPBase {
  static setup(_domainSeparator: string): Pedersen64 {
    return new Pedersen64();
  }

  hash(bits: BitInput): string {
    return this.crypto.pedersen64Hash(this.toBits(bits));
  }

  commit(bits: BitInput, scalar: ScalarLike): string {
    return this.crypto.pedersen64Commit(this.toBits(bits), this.toScalar(scalar));
  }

  commitToGroup(bits: BitInput, scalar: ScalarLike): string {
    return this.crypto.pedersen64CommitToGroup(this.toBits(bits), this.toScalar(scalar));
  }
}

export class Pedersen128 extends BHPBase {
  static setup(_domainSeparator: string): Pedersen128 {
    return new Pedersen128();
  }

  hash(bits: BitInput): string {
    return this.crypto.pedersen128Hash(this.toBits(bits));
  }

  commit(bits: BitInput, scalar: ScalarLike): string {
    return this.crypto.pedersen128Commit(this.toBits(bits), this.toScalar(scalar));
  }

  commitToGroup(bits: BitInput, scalar: ScalarLike): string {
    return this.crypto.pedersen128CommitToGroup(this.toBits(bits), this.toScalar(scalar));
  }
}

class PoseidonBase {
  protected readonly crypto = getHybridCrypto();

  protected normalize(fields: FieldInput): string[] {
    return normalizeFields(fields);
  }
}

export class Poseidon2 extends PoseidonBase {
  static setup(_domainSeparator: string): Poseidon2 {
    return new Poseidon2();
  }

  hash(fields: FieldInput): string {
    return this.crypto.poseidon2Hash(this.normalize(fields));
  }

  hashToScalar(fields: FieldInput): string {
    return this.crypto.poseidon2HashToScalar(this.normalize(fields));
  }

  hashToGroup(fields: FieldInput): string {
    return this.crypto.poseidon2HashToGroup(this.normalize(fields));
  }

  hashMany(fields: FieldInput, rate: number): HashManyResult<string> {
    return this.crypto.poseidon2HashMany(this.normalize(fields), rate);
  }
}

export class Poseidon4 extends PoseidonBase {
  static setup(_domainSeparator: string): Poseidon4 {
    return new Poseidon4();
  }

  hash(fields: FieldInput): Field {
    return Field.fromNitro(this.crypto.poseidon4Hash(this.normalize(fields)));
  }

  hashToScalar(fields: FieldInput): string {
    return this.crypto.poseidon4HashToScalar(this.normalize(fields));
  }

  hashToGroup(fields: FieldInput): string {
    return this.crypto.poseidon4HashToGroup(this.normalize(fields));
  }

  hashMany(fields: FieldInput, rate: number): HashManyResult<string> {
    return this.crypto.poseidon4HashMany(this.normalize(fields), rate);
  }
}

export class Poseidon8 extends PoseidonBase {
  static setup(_domainSeparator: string): Poseidon8 {
    return new Poseidon8();
  }

  hash(fields: FieldInput): string {
    return this.crypto.poseidon8Hash(this.normalize(fields));
  }

  hashToScalar(fields: FieldInput): string {
    return this.crypto.poseidon8HashToScalar(this.normalize(fields));
  }

  hashToGroup(fields: FieldInput): string {
    return this.crypto.poseidon8HashToGroup(this.normalize(fields));
  }

  hashMany(fields: FieldInput, rate: number): HashManyResult<string> {
    return this.crypto.poseidon8HashMany(this.normalize(fields), rate);
  }
}

export class KeyPair {
  static generate(): {
    privateKey: string;
    publicKey: string;
    address: string;
  } {
    try {
      return getHybridCrypto().generateKeyPair();
    } catch (e) {
      throw new Error(`KeyPair.generate(): ${(e as Error).message}`);
    }
  }
}

export class ComputeKey {
  static from_private_key(privateKey: string): string {
    try {
      return getHybridCrypto().computeKeyFromPrivateKey(privateKey);
    } catch (e) {
      throw new Error(`ComputeKey.from_private_key(): ${(e as Error).message}`);
    }
  }
}

export class GraphKey {
  static from_private_key(privateKey: string): string {
    try {
      return getHybridCrypto().graphKeyFromPrivateKey(privateKey);
    } catch (e) {
      throw new Error(`GraphKey.from_private_key(): ${(e as Error).message}`);
    }
  }
}

export class Mnemonic {
  static verify(mnemonic: string): boolean {
    try {
      return getHybridCrypto().verifyMnemonic(mnemonic);
    } catch (e) {
      throw new Error(`Mnemonic.verify(): ${(e as Error).message}`);
    }
  }

  static generate(): string {
    try {
      return getHybridCrypto().generateMnemonic();
    } catch (e) {
      throw new Error(`Mnemonic.generate(): ${(e as Error).message}`);
    }
  }
}
