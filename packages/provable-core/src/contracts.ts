export type NetworkName = "mainnet" | "testnet" | (string & {});

export interface ProvableSdkEnv {
  network: NetworkName;
  apiHost?: string;
  proverUri?: string;
  recordScannerUri?: string;
  apiKey?: string;
  consumerId?: string;
  [key: string]: unknown;
}

export interface EngineInitContext {
  env: ProvableSdkEnv;
}

export interface EngineCapabilities {
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
  readonly runtime?: {
    initThreadPool?(threadCount: number): Promise<void> | void;
  };
}

export interface ProvableEngine {
  readonly id: string;
  readonly displayName: string;
  init(ctx: EngineInitContext): Promise<EngineCapabilities> | EngineCapabilities;
}
