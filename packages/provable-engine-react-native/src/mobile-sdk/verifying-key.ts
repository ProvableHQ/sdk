import { getNitroClassNetworkAware } from "./current-network";
import type { VerifyingKey as VerifyingKeyNitro } from "./specs/program-manager.nitro";

const createNitro = (): VerifyingKeyNitro =>
  getNitroClassNetworkAware<VerifyingKeyNitro>("VerifyingKey");

const toArrayBuffer = (bytes: ArrayBuffer | Uint8Array): ArrayBuffer => {
  if (bytes instanceof Uint8Array) {
    return (bytes.buffer as ArrayBuffer).slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
  }
  return bytes as ArrayBuffer;
};

export class VerifyingKey {
  private readonly _nitro: VerifyingKeyNitro;

  private constructor(nitro: VerifyingKeyNitro) {
    this._nitro = nitro;
  }

  // Static creators for known credits.aleo verifiers
  static bondPublicVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initBondPublicVerifier();
    return new VerifyingKey(nitro);
  }
  static bondValidatorVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initBondValidatorVerifier();
    return new VerifyingKey(nitro);
  }
  static claimUnbondPublicVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initClaimUnbondPublicVerifier();
    return new VerifyingKey(nitro);
  }
  static feePrivateVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initFeePrivateVerifier();
    return new VerifyingKey(nitro);
  }
  static feePublicVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initFeePublicVerifier();
    return new VerifyingKey(nitro);
  }
  static inclusionVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initInclusionVerifier();
    return new VerifyingKey(nitro);
  }
  static joinVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initJoinVerifier();
    return new VerifyingKey(nitro);
  }
  static setValidatorStateVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initSetValidatorStateVerifier();
    return new VerifyingKey(nitro);
  }
  static splitVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initSplitVerifier();
    return new VerifyingKey(nitro);
  }
  static transferPrivateVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initTransferPrivateVerifier();
    return new VerifyingKey(nitro);
  }
  static transferPrivateToPublicVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initTransferPrivateToPublicVerifier();
    return new VerifyingKey(nitro);
  }
  static transferPublicVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initTransferPublicVerifier();
    return new VerifyingKey(nitro);
  }
  static transferPublicAsSignerVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initTransferPublicAsSignerVerifier();
    return new VerifyingKey(nitro);
  }
  static transferPublicToPrivateVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initTransferPublicToPrivateVerifier();
    return new VerifyingKey(nitro);
  }
  static unbondPublicVerifier(): VerifyingKey {
    const nitro = createNitro();
    nitro.initUnbondPublicVerifier();
    return new VerifyingKey(nitro);
  }

  static fromBytes(bytes: ArrayBuffer | Uint8Array): VerifyingKey {
    const nitro = createNitro();
    nitro.initWithBytes(toArrayBuffer(bytes));
    return new VerifyingKey(nitro);
  }

  static fromString(key: string): VerifyingKey {
    const nitro = createNitro();
    nitro.initWithString(key);
    return new VerifyingKey(nitro);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this._nitro.toBytes());
  }

  checksum(): string {
    return this._nitro.checksum();
  }

  numConstraints(): number {
    return this._nitro.numConstraints();
  }

  copy(): VerifyingKey {
    return new VerifyingKey(this._nitro.copy());
  }

  // Type checks
  isBondPublicVerifier(): boolean {
    return this._nitro.isBondPublicVerifier();
  }
  isBondValidatorVerifier(): boolean {
    return this._nitro.isBondValidatorVerifier();
  }
  isClaimUnbondPublicVerifier(): boolean {
    return this._nitro.isClaimUnbondPublicVerifier();
  }
  isFeePrivateVerifier(): boolean {
    return this._nitro.isFeePrivateVerifier();
  }
  isFeePublicVerifier(): boolean {
    return this._nitro.isFeePublicVerifier();
  }
  isInclusionVerifier(): boolean {
    return this._nitro.isInclusionVerifier();
  }
  isJoinVerifier(): boolean {
    return this._nitro.isJoinVerifier();
  }
  isSetValidatorStateVerifier(): boolean {
    return this._nitro.isSetValidatorStateVerifier();
  }
  isSplitVerifier(): boolean {
    return this._nitro.isSplitVerifier();
  }
  isTransferPrivateVerifier(): boolean {
    return this._nitro.isTransferPrivateVerifier();
  }
  isTransferPrivateToPublicVerifier(): boolean {
    return this._nitro.isTransferPrivateToPublicVerifier();
  }
  isTransferPublicVerifier(): boolean {
    return this._nitro.isTransferPublicVerifier();
  }
  isTransferPublicAsSignerVerifier(): boolean {
    return this._nitro.isTransferPublicAsSignerVerifier();
  }
  isTransferPublicToPrivateVerifier(): boolean {
    return this._nitro.isTransferPublicToPrivateVerifier();
  }
  isUnbondPublicVerifier(): boolean {
    return this._nitro.isUnbondPublicVerifier();
  }

  get nitro(): VerifyingKeyNitro {
    return this._nitro;
  }
}
