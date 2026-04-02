import { getNitro, normalizeNetwork } from "./nitro-core.js";

type AccountLike = {
  privateKey(): { toString(): string; to_string?(): string; toViewKey?(): { toString(): string } };
  address(): { toString(): string; to_string?(): string };
  viewKey?(): { toString(): string; to_string?(): string };
};

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

function createProgramManagerAdapter(pm: any, keyProvider: unknown) {
  return {
    async buildExecutionTransaction(options: any) {
      return pm.buildExecutionTransaction?.({
        programName: options.programName ?? options.program,
        functionName: options.functionName,
        inputs: options.inputs ?? [],
        priorityFee: options.priorityFee ?? 0,
        privateFee: Boolean(options.privateFee),
        feeRecord: options.feeRecord,
        privateKey: options.privateKey,
        program: options.program,
        imports: options.imports,
        edition: options.edition,
        provingKey: options.provingKey,
        verifyingKey: options.verifyingKey,
        offlineQuery: options.offlineQuery,
      });
    },
    async provingRequest(options: any) {
      return pm.provingRequest?.({
        programName: options.programName ?? options.programSource ?? options.program,
        functionName: options.functionName,
        inputs: options.inputs ?? [],
        privateFee: Boolean(options.privateFee),
        baseFee: options.baseFee ?? 0,
        priorityFee: options.priorityFee ?? 0,
        feeRecord: options.feeRecord,
        privateKey: options.privateKey,
        programSource: options.programSource ?? options.program,
        programImports: options.programImports ?? options.imports,
        broadcast: Boolean(options.broadcast),
        unchecked: Boolean(options.unchecked),
        edition: options.edition,
        useFeeMaster: options.useFeeMaster ?? true,
      });
    },
    async buildFeeAuthorization(options: any) {
      return pm.buildFeeAuthorization?.({
        deploymentOrExecutionId: options.deploymentOrExecutionId,
        baseFeeCredits: options.baseFeeCredits ?? 0,
        priorityFeeCredits: options.priorityFeeCredits ?? 0,
        privateKey: options.privateKey,
        feeRecord: options.feeRecord,
      });
    },
    async estimateExecutionFee(options: any) {
      return pm.estimateExecutionFee?.({
        programName: options.programName ?? options.program,
        functionName: options.functionName,
        program: options.program,
        imports: options.imports,
        edition: options.edition,
      });
    },
    async estimateDeploymentFee(program: string, imports?: Record<string, string>) {
      return pm.estimateDeploymentFee?.(program, imports);
    },
    async estimateFeeForAuthorization(program: string, imports: any, authorization: any) {
      return pm.estimateFeeForAuthorization?.(program, imports, authorization);
    },
    keyProvider,
  };
}

export async function createReactNativeBindings(network: unknown) {
  const nitro = getNitro(network);
  const normalizedNetwork = normalizeNetwork(network);

  class MobileAccount implements AccountLike {
    readonly inner: any;
    constructor(params: { privateKey?: string } = {}) {
      this.inner = new nitro.Account(params);
    }
    privateKey() {
      const key = this.inner.privateKey();
      if (typeof key.to_string !== "function" && typeof key.toString === "function") {
        key.to_string = () => key.toString();
      }
      if (typeof key.to_view_key !== "function" && typeof key.toViewKey === "function") {
        key.to_view_key = () => {
          const vk = key.toViewKey();
          if (typeof vk.to_string !== "function" && typeof vk.toString === "function") {
            vk.to_string = () => vk.toString();
          }
          return vk;
        };
      }
      return key;
    }
    address() {
      const addr = this.inner.address();
      if (typeof addr.to_string !== "function" && typeof addr.toString === "function") {
        addr.to_string = () => addr.toString();
      }
      return addr;
    }
    viewKey() {
      const vk = this.inner.viewKey?.() ?? this.inner.privateKey()?.toViewKey?.();
      if (vk && typeof vk.to_string !== "function" && typeof vk.toString === "function") {
        vk.to_string = () => vk.toString();
      }
      return vk;
    }
  }

  return {
    Account: MobileAccount,
    AleoNetworkClient: class AleoNetworkClient extends nitro.AleoNetworkClient {
      constructor(host: string, options: Record<string, unknown> = {}) {
        super(host, { ...options, network: normalizedNetwork });
      }
    },
    RecordScanner: class RecordScanner extends nitro.RecordScanner {
      constructor(options: Record<string, unknown> = {}) {
        const host = (options.host as string | undefined) ?? "https://api.provable.com";
        super({
          url: `${host.replace(/\/+$/, "")}/scanner`,
          ...options,
        });
      }
    },
    NetworkRecordProvider: class NetworkRecordProvider extends nitro.NetworkRecordProvider {
      constructor(options: Record<string, unknown> = {}) {
        const host = (options.host as string | undefined) ?? "https://api.provable.com/v2";
        const account = (options.account as unknown) ?? new nitro.Account();
        const networkClient =
          options.networkClient ??
          new nitro.AleoNetworkClient(host, {
            ...(options as Record<string, unknown>),
            network: normalizedNetwork,
          });
        super({ account, networkClient });
      }
    },
    encryptAuthorization(publicKey: string, authorization: unknown): string {
      if (!nitro.encryptAuthorization) {
        throw new Error("Shield encryptAuthorization is unavailable.");
      }
      return nitro.encryptAuthorization(publicKey, authorization);
    },
    encryptProvingRequest(publicKey: string, provingRequest: unknown): string {
      if (!nitro.encryptProvingRequest) {
        throw new Error("Shield encryptProvingRequest is unavailable.");
      }
      return nitro.encryptProvingRequest(publicKey, provingRequest);
    },
    encryptRegistrationRequest(publicKey: string, viewKey: unknown, start: number): string {
      if (!nitro.encryptRegistrationRequest) {
        throw new Error("Shield encryptRegistrationRequest is unavailable.");
      }
      return nitro.encryptRegistrationRequest(publicKey, viewKey, parseNumber(start));
    },
    highLevel: {
      createAccount(params?: { privateKey?: string }): unknown {
        return new MobileAccount(params);
      },
      createProgramManager(hostOrOptions?: string | Record<string, unknown>): unknown {
        const host = typeof hostOrOptions === "string" ? hostOrOptions : undefined;
        const keyProvider = new nitro.AleoKeyProvider();
        const pmOptions: Record<string, unknown> =
          typeof hostOrOptions === "object"
            ? { ...hostOrOptions, keyProvider, host: (hostOrOptions.host as string | undefined) ?? host }
            : { host, keyProvider };
        const pm = new nitro.ProgramManager(pmOptions);
        return createProgramManagerAdapter(pm, keyProvider);
      },
      createKeyProvider(): unknown {
        return new nitro.AleoKeyProvider();
      },
      verifyProof(options: { verifyingKey: string; inputs: string[]; proof: string }): boolean {
        if (!nitro.ProvingRequest?.fromString) {
          throw new Error("Proof verification is unavailable in this runtime.");
        }
        const request = nitro.ProvingRequest.fromString(options.proof);
        return Boolean(request.verify());
      },
    },
  };
}
