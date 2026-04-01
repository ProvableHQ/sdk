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

type ShieldModule = {
  Account: new (args: Record<string, unknown>) => unknown;
  AleoNetworkClient: new (host: string, options?: Record<string, unknown>) => unknown;
  RecordScanner: new (options: Record<string, unknown>) => unknown;
  NetworkRecordProvider: new (options: Record<string, unknown>) => unknown;
  encryptAuthorization: (publicKey: string, authorization: unknown) => string;
  encryptProvingRequest: (publicKey: string, provingRequest: unknown) => string;
};

async function loadShieldModule(): Promise<ShieldModule> {
  const shield = (await import("@provablehq/shield-mobile-sdk")) as unknown as ShieldModule;
  return shield;
}

export class ReactNativeEngine implements ProvableEngine {
  readonly id = "react-native";
  readonly displayName = "Provable React Native Engine";

  async init(): Promise<EngineCapabilities> {
    const shield = await loadShieldModule();

    return {
      account: {
        fromPrivateKey(privateKey: string): unknown {
          return new shield.Account({ privateKey });
        },
      },
      crypto: {
        encryptAuthorization(publicKey: string, authorization: unknown): string {
          return shield.encryptAuthorization(publicKey, authorization);
        },
        encryptProvingRequest(publicKey: string, provingRequest: unknown): string {
          return shield.encryptProvingRequest(publicKey, provingRequest);
        },
      },
      network: {
        createNetworkClient(host: string, options?: Record<string, unknown>): unknown {
          return new shield.AleoNetworkClient(host, options);
        },
        createRecordScanner(options: Record<string, unknown>): unknown {
          return new shield.RecordScanner(options);
        },
        createRecordProvider(options: Record<string, unknown>): unknown {
          return new shield.NetworkRecordProvider(options);
        },
      },
    };
  }
}

export function createReactNativeEngine(): ProvableEngine {
  return new ReactNativeEngine();
}
