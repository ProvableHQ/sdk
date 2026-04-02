import { createReactNativeBindings } from "./native-bindings-nitro.js";

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
    createKeyProvider?(): unknown;
    verifyProof?(options: { verifyingKey: string; inputs: string[]; proof: string }): boolean;
  };
};

type ProvableEngine = {
  readonly id: string;
  readonly displayName: string;
  init(ctx?: { env?: Record<string, unknown> }): Promise<EngineCapabilities> | EngineCapabilities;
};

export class ReactNativeEngine implements ProvableEngine {
  readonly id = "react-native";
  readonly displayName = "Provable React Native Engine";

  async init(ctx?: { env?: Record<string, unknown> }): Promise<EngineCapabilities> {
    const mobile = await createReactNativeBindings(ctx?.env?.network);

    return {
      account: {
        fromPrivateKey(privateKey: string): unknown {
          return new mobile.Account({ privateKey });
        },
      },
      crypto: {
        encryptAuthorization(publicKey: string, authorization: unknown): string {
          return mobile.encryptAuthorization(publicKey, authorization);
        },
        encryptProvingRequest(publicKey: string, provingRequest: unknown): string {
          return mobile.encryptProvingRequest(publicKey, provingRequest);
        },
      },
      network: {
        createNetworkClient(host: string, options?: Record<string, unknown>): unknown {
          return new mobile.AleoNetworkClient(host, options);
        },
        createRecordScanner(options: Record<string, unknown>): unknown {
          return new mobile.RecordScanner(options);
        },
        createRecordProvider(options: Record<string, unknown>): unknown {
          return new mobile.NetworkRecordProvider(options);
        },
      },
      highLevel: mobile.highLevel,
    };
  }
}

export function createReactNativeEngine(): ProvableEngine {
  return new ReactNativeEngine();
}
