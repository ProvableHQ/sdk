type NetworkName = "mainnet" | "testnet";

export function normalizeNetwork(value: unknown): NetworkName {
  return typeof value === "string" && value.toLowerCase() === "testnet" ? "testnet" : "mainnet";
}

export type NitroModule = {
  setNetwork?: (network: NetworkName) => void;
  Account: new (params?: { privateKey?: string }) => any;
  AleoNetworkClient: new (host: string, options?: Record<string, unknown>) => any;
  RecordScanner: new (options: Record<string, unknown>) => any;
  NetworkRecordProvider: new (options: Record<string, unknown>) => any;
  ProgramManager: new (options?: Record<string, unknown>) => any;
  AleoKeyProvider: new (options?: Record<string, unknown>) => any;
  ProvingRequest?: { fromString(value: string): { verify(): boolean } };
  encryptAuthorization?: (publicKey: string, authorization: unknown) => string;
  encryptProvingRequest?: (publicKey: string, provingRequest: unknown) => string;
  encryptRegistrationRequest?: (publicKey: string, viewKey: unknown, start: number) => string;
};

let nitroCached: NitroModule | null = null;

export function getNitro(network: unknown): NitroModule {
  if (!nitroCached) {
    nitroCached = require("../src/mobile-sdk/index.ts") as NitroModule;
  }
  nitroCached.setNetwork?.(normalizeNetwork(network));
  return nitroCached;
}
