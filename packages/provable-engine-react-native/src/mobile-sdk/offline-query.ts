import { getNitroClassNetworkAware } from "./current-network";
import type { OfflineQuery as OfflineQueryNitro } from "./specs/program-manager.nitro";

const createNitro = (): OfflineQueryNitro =>
  getNitroClassNetworkAware<OfflineQueryNitro>("OfflineQuery");

const toArrayBuffer = (bytes: ArrayBuffer | Uint8Array): ArrayBuffer => {
  if (bytes instanceof Uint8Array) {
    return (bytes.buffer as ArrayBuffer).slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
  }
  return bytes as ArrayBuffer;
};

export class OfflineQuery {
  private readonly _nitro: OfflineQueryNitro;

  private constructor(nitro: OfflineQueryNitro) {
    this._nitro = nitro;
  }

  static fromString(json: string): OfflineQuery {
    const nitro = createNitro();
    nitro.initWithString(json);
    return new OfflineQuery(nitro);
  }

  static fromBytes(bytes: ArrayBuffer | Uint8Array): OfflineQuery {
    const nitro = createNitro();
    nitro.initWithBytes(toArrayBuffer(bytes));
    return new OfflineQuery(nitro);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this._nitro.toBytes());
  }

  addBlockHeight(height: number): void {
    this._nitro.addBlockHeight(height);
  }

  addStatePath(commitment: string, statePath: string): void {
    this._nitro.addStatePath(commitment, statePath);
  }

  get nitro(): OfflineQueryNitro {
    return this._nitro;
  }
}
