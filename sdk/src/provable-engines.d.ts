declare module "@provablehq/provablekit" {
  export type ProvableSdkEnv = {
    network: "mainnet" | "testnet" | (string & {});
    apiHost?: string;
    proverUri?: string;
    recordScannerUri?: string;
    apiKey?: string;
    consumerId?: string;
    [key: string]: unknown;
  };

  export type EngineCapabilities = {
    readonly account: {
      fromPrivateKey(privateKey: string): unknown;
    };
    readonly crypto: {
      encryptAuthorization(publicKey: string, authorization: unknown): string;
      encryptProvingRequest(publicKey: string, provingRequest: unknown): string;
    };
    readonly network: {
      createNetworkClient(host: string, options?: Record<string, unknown>): unknown;
      createRecordScanner(options: Record<string, unknown>): unknown;
      createRecordProvider(options: Record<string, unknown>): unknown;
    };
  };

  export type ProvableEngine = {
    readonly id: string;
    readonly displayName: string;
    init(ctx?: { env?: Record<string, unknown> }): Promise<EngineCapabilities> | EngineCapabilities;
  };

  export class ProvableSDK {
    static init(options: { engine: ProvableEngine; env: ProvableSdkEnv }): Promise<EngineCapabilities>;
    static getEngine(): ProvableEngine;
    static getEnv(): ProvableSdkEnv;
    static getCapabilities(): EngineCapabilities;
  }
}

declare module "@provablehq/provable-engine-wasm" {
  import type { ProvableEngine } from "@provablehq/provablekit";
  export class WasmEngine implements ProvableEngine {
    readonly id: string;
    readonly displayName: string;
    init(ctx?: { env?: Record<string, unknown> }): Promise<unknown>;
  }
  export function createWasmEngine(): ProvableEngine;
}

declare module "@provablehq/provable-engine-react-native" {
  import type { ProvableEngine } from "@provablehq/provablekit";
  export class ReactNativeEngine implements ProvableEngine {
    readonly id: string;
    readonly displayName: string;
    init(ctx?: { env?: Record<string, unknown> }): Promise<unknown>;
  }
  export function createReactNativeEngine(): ProvableEngine;
}
