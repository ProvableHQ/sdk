type EngineCapabilities = {
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

type ProvableEngine = {
  readonly id: string;
  readonly displayName: string;
  init(ctx?: { env?: Record<string, unknown> }): Promise<EngineCapabilities> | EngineCapabilities;
};

type WasmSdkModule = {
  PrivateKey: {
    from_string(privateKey: string): unknown;
  };
  initThreadPool?: (threads?: number) => Promise<void>;
};

async function loadWasmSdk(network?: unknown): Promise<WasmSdkModule> {
  const normalized = typeof network === "string" ? network.toLowerCase() : "mainnet";
  const moduleName =
    normalized === "testnet"
      ? "@provablehq/provable-engine-wasm/testnet.js"
      : "@provablehq/provable-engine-wasm/mainnet.js";
  return (await import(moduleName)) as unknown as WasmSdkModule;
}

export class WasmEngine implements ProvableEngine {
  readonly id = "wasm";
  readonly displayName = "Provable WASM Engine";

  async init(ctx?: { env?: Record<string, unknown> }): Promise<EngineCapabilities> {
    const sdk = await loadWasmSdk(ctx?.env?.network);

    return {
      account: {
        fromPrivateKey(privateKey: string): unknown {
          return sdk.PrivateKey.from_string(privateKey);
        },
      },
      crypto: {
        encryptAuthorization(_publicKey: string, _authorization: unknown): string {
          throw new Error("encryptAuthorization is not available in the pure wasm engine facade.");
        },
        encryptProvingRequest(_publicKey: string, _provingRequest: unknown): string {
          throw new Error("encryptProvingRequest is not available in the pure wasm engine facade.");
        },
      },
      network: {
        createNetworkClient(_host: string, _options?: Record<string, unknown>): unknown {
          throw new Error("NetworkClient is not provided by the pure wasm engine facade.");
        },
        createRecordScanner(_options: Record<string, unknown>): unknown {
          throw new Error("RecordScanner is not provided by the pure wasm engine facade.");
        },
        createRecordProvider(_options: Record<string, unknown>): unknown {
          throw new Error("RecordProvider is not provided by the pure wasm engine facade.");
        },
      },
    };
  }
}

export function createWasmEngine(): ProvableEngine {
  return new WasmEngine();
}
