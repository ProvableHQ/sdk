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
  readonly highLevel?: {
    createProgramManager?(host?: string): unknown;
    createAccount?(params?: { privateKey?: string }): unknown;
    verifyProof?(options: { verifyingKey: string; inputs: string[]; proof: string }): boolean;
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
  Proof?: { fromString(proof: string): unknown };
  VerifyingKey?: { fromString(vk: string): unknown };
  snarkVerify?: (verifyingKey: unknown, inputs: string[], proof: unknown) => boolean;
  ProgramManager?: unknown;
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
          throw new Error("encryptAuthorization is not available in the wasm engine.");
        },
        encryptProvingRequest(_publicKey: string, _provingRequest: unknown): string {
          throw new Error("encryptProvingRequest is not available in the wasm engine.");
        },
      },
      network: {
        createNetworkClient(_host: string, _options?: Record<string, unknown>): unknown {
          return { host: _host, options: _options ?? {} };
        },
        createRecordScanner(_options: Record<string, unknown>): unknown {
          return { options: _options };
        },
        createRecordProvider(_options: Record<string, unknown>): unknown {
          return { options: _options };
        },
      },
      highLevel: {
        createProgramManager(_host?: string): unknown {
          return (sdk as { ProgramManager?: unknown }).ProgramManager;
        },
        createAccount(params?: { privateKey?: string }): unknown {
          if (params?.privateKey) return sdk.PrivateKey.from_string(params.privateKey);
          return new (sdk.PrivateKey as unknown as { new (): unknown })();
        },
        verifyProof(options: { verifyingKey: string; inputs: string[]; proof: string }): boolean {
          if (!sdk.Proof || !sdk.VerifyingKey || !sdk.snarkVerify) {
            throw new Error("Proof verification is not available in this wasm module.");
          }
          return sdk.snarkVerify(sdk.VerifyingKey.fromString(options.verifyingKey), options.inputs, sdk.Proof.fromString(options.proof));
        },
      },
    };
  }
}

export function createWasmEngine(): ProvableEngine {
  return new WasmEngine();
}
