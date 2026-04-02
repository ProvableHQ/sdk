import { getNitroClassNetworkAware } from "./current-network";
import type { ProvingKey as ProvingKeyNitro } from "./specs/program-manager.nitro";

const createNitro = (): ProvingKeyNitro => getNitroClassNetworkAware<ProvingKeyNitro>("ProvingKey");

const toArrayBuffer = (bytes: ArrayBuffer | Uint8Array): ArrayBuffer => {
  if (bytes instanceof Uint8Array) {
    return (bytes.buffer as ArrayBuffer).slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
  }
  return bytes as ArrayBuffer;
};

export class ProvingKey {
  private readonly _nitro: ProvingKeyNitro;

  private constructor(nitro: ProvingKeyNitro) {
    this._nitro = nitro;
  }

  static fromBytes(bytes: ArrayBuffer | Uint8Array): ProvingKey {
    const nitro = createNitro();
    nitro.initWithBytes(toArrayBuffer(bytes));
    return new ProvingKey(nitro);
  }

  static fromString(key: string): ProvingKey {
    const nitro = createNitro();
    nitro.initWithString(key);
    return new ProvingKey(nitro);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this._nitro.toBytes());
  }

  checksum(): string {
    return this._nitro.checksum();
  }

  copy(): ProvingKey {
    return new ProvingKey(this._nitro.copy());
  }

  // Type checks with metadata JSON
  isBondPublicProver(metadataJson: string): boolean {
    return this._nitro.isBondPublicProver(metadataJson);
  }
  isBondValidatorProver(metadataJson: string): boolean {
    return this._nitro.isBondValidatorProver(metadataJson);
  }
  isClaimUnbondPublicProver(metadataJson: string): boolean {
    return this._nitro.isClaimUnbondPublicProver(metadataJson);
  }
  isFeePrivateProver(metadataJson: string): boolean {
    return this._nitro.isFeePrivateProver(metadataJson);
  }
  isFeePublicProver(metadataJson: string): boolean {
    return this._nitro.isFeePublicProver(metadataJson);
  }
  isInclusionProver(metadataJson: string): boolean {
    return this._nitro.isInclusionProver(metadataJson);
  }
  isJoinProver(metadataJson: string): boolean {
    return this._nitro.isJoinProver(metadataJson);
  }
  isSetValidatorStateProver(metadataJson: string): boolean {
    return this._nitro.isSetValidatorStateProver(metadataJson);
  }
  isSplitProver(metadataJson: string): boolean {
    return this._nitro.isSplitProver(metadataJson);
  }
  isTransferPrivateProver(metadataJson: string): boolean {
    return this._nitro.isTransferPrivateProver(metadataJson);
  }
  isTransferPrivateToPublicProver(metadataJson: string): boolean {
    return this._nitro.isTransferPrivateToPublicProver(metadataJson);
  }
  isTransferPublicProver(metadataJson: string): boolean {
    return this._nitro.isTransferPublicProver(metadataJson);
  }
  isTransferPublicAsSignerProver(metadataJson: string): boolean {
    return this._nitro.isTransferPublicAsSignerProver(metadataJson);
  }
  isTransferPublicToPrivateProver(metadataJson: string): boolean {
    return this._nitro.isTransferPublicToPrivateProver(metadataJson);
  }
  isUnbondPublicProver(metadataJson: string): boolean {
    return this._nitro.isUnbondPublicProver(metadataJson);
  }

  get nitro(): ProvingKeyNitro {
    return this._nitro;
  }
}
