import * as wasmMainnet from "@provablehq/provable-engine-wasm/mainnet.js";
import * as wasmTestnet from "@provablehq/provable-engine-wasm/testnet.js";
import sodium from "libsodium-wrappers-sumo";

type WasmLike = Record<string, any>;

type NetworkName = "mainnet" | "testnet";

type AccountLike = {
  privateKey(): { to_string(): string; to_view_key(): { to_string(): string } };
  address(): { to_string(): string };
  viewKey(): { to_string(): string };
};

await sodium.ready;

function normalizeHost(host?: string): string {
  return (host ?? "https://api.provable.com/v2").replace(/\/+$/, "");
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

function maybeRecord(record: any, wasm: WasmLike): any {
  if (!record) return undefined;
  if (typeof record === "string" && wasm.RecordPlaintext?.fromString) {
    return wasm.RecordPlaintext.fromString(record);
  }
  return record;
}

function toUint8Array(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (typeof value === "string") return new TextEncoder().encode(value);
  return new TextEncoder().encode(JSON.stringify(value ?? {}));
}

function toLeBytes(value: any): Uint8Array {
  if (!value) return new Uint8Array();
  for (const name of ["toBytesLe", "to_bytes_le", "toBytes", "to_bytes"]) {
    if (typeof value?.[name] === "function") {
      return toUint8Array(value[name]());
    }
  }
  return toUint8Array(value?.toString?.() ?? value);
}

function sealMessageBase64(publicKeyB64: string, message: Uint8Array): string {
  const variants = (sodium as any).base64_variants ?? {};
  const variant = variants.ORIGINAL ?? variants.ORIGINAL_NO_PADDING ?? variants.URLSAFE_NO_PADDING;
  const fromBase64 = (sodium as any).from_base64.bind(sodium);
  const toBase64 = (sodium as any).to_base64.bind(sodium);
  let publicKey: Uint8Array;
  try {
    publicKey = fromBase64(publicKeyB64, variant);
  } catch {
    const cleaned = publicKeyB64.replace(/-/g, "+").replace(/_/g, "/");
    publicKey = fromBase64(cleaned, variant);
  }
  const sealed = (sodium as any).crypto_box_seal(message, publicKey);
  return toBase64(sealed, variant);
}

function normalizeNetwork(value: unknown): NetworkName {
  return typeof value === "string" && value.toLowerCase() === "testnet" ? "testnet" : "mainnet";
}

function loadSdk(network: unknown): WasmLike {
  return (normalizeNetwork(network) === "testnet" ? wasmTestnet : wasmMainnet) as WasmLike;
}

function createAccountClass(wasm: WasmLike) {
  return class MobileAccount implements AccountLike {
    readonly innerPrivateKey: any;

    constructor(params: { privateKey?: string } = {}) {
      this.innerPrivateKey = params.privateKey
        ? wasm.PrivateKey.from_string(params.privateKey)
        : new wasm.PrivateKey();
    }

    privateKey(): { to_string(): string; to_view_key(): { to_string(): string } } {
      return this.innerPrivateKey;
    }

    address(): { to_string(): string } {
      return this.innerPrivateKey.to_address();
    }

    viewKey(): { to_string(): string } {
      return this.innerPrivateKey.to_view_key();
    }
  };
}

export function createReactNativeBindings(network: unknown) {
  const wasm = loadSdk(network);
  const Account = createAccountClass(wasm);

  return {
    Account,
    AleoNetworkClient: class AleoNetworkClient {
      account?: AccountLike;
      constructor(
        public readonly host: string,
        public readonly options: Record<string, unknown> = {},
      ) {}

      async get(path: string): Promise<any> {
        const res = await fetch(`${normalizeHost(this.host)}${path}`);
        if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
        return res.json();
      }

      async post(path: string, body: unknown): Promise<any> {
        const res = await fetch(`${normalizeHost(this.host)}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`);
        return res.json();
      }

      setAccount(account: AccountLike): void {
        this.account = account;
      }

      async submitTransaction(transaction: any): Promise<string> {
        const payload = typeof transaction === "string" ? transaction : transaction?.toString?.() ?? transaction;
        const out = await this.post(`/${normalizeNetwork(network)}/transaction/broadcast`, payload);
        return out?.transactionId ?? out?.tx_id ?? out ?? "";
      }

      async getLatestHeight(): Promise<number> {
        const out = await this.get(`/${normalizeNetwork(network)}/block/height/latest`);
        const n = Number(out);
        if (Number.isFinite(n)) return n;
        throw new Error(`Invalid height response: ${String(out)}`);
      }

      async getProgram(programId: string): Promise<string> {
        return this.get(`/${normalizeNetwork(network)}/program/${encodeURIComponent(programId)}`);
      }

      async getProgramImports(programSource: string): Promise<Record<string, string>> {
        const imports: string[] = [];
        try {
          const program = wasm.Program.fromString(programSource);
          const values = program.getImports?.() ?? [];
          for (const item of values) {
            imports.push(item?.toString?.() ?? item?.to_string?.() ?? String(item));
          }
        } catch {
          // best effort
        }
        const collected: Record<string, string> = {};
        for (const id of imports) {
          collected[id] = await this.getProgram(id);
        }
        return collected;
      }

      async getProgramMappingValue(programId: string, mapping: string, key: string): Promise<any> {
        return this.get(`/${normalizeNetwork(network)}/program/${programId}/mapping/${mapping}/${encodeURIComponent(key)}`);
      }
    },
    RecordScanner: class RecordScanner {
      constructor(public readonly options: Record<string, unknown> = {}) {}

      host(): string {
        return normalizeHost((this.options.host as string | undefined) ?? "https://api.provable.com");
      }
      net(): string {
        return (this.options.network as string | undefined) ?? normalizeNetwork(network);
      }
      headers(): Record<string, string> {
        return (this.options.headers as Record<string, string> | undefined) ?? {};
      }
      async getPublicKey(): Promise<any> {
        const res = await fetch(`${this.host()}/scanner/${this.net()}/pubkey`, { headers: this.headers() });
        if (!res.ok) throw new Error(`Scanner /pubkey failed (${res.status})`);
        return res.json();
      }
      async registerEncrypted(keyId: string, ciphertext: string): Promise<any> {
        const res = await fetch(`${this.host()}/scanner/${this.net()}/register/encrypted`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...this.headers() },
          body: JSON.stringify({ key_id: keyId, ciphertext }),
        });
        if (!res.ok) throw new Error(`Scanner /register/encrypted failed (${res.status})`);
        return res.json();
      }
      async getOwnedRecords(payload: unknown): Promise<any> {
        const res = await fetch(`${this.host()}/scanner/${this.net()}/records/owned`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...this.headers() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Scanner /records/owned failed (${res.status})`);
        return res.json();
      }
    },
    NetworkRecordProvider: class NetworkRecordProvider {
      constructor(public readonly options: Record<string, unknown> = {}) {}

      async getRecords(payload: unknown): Promise<any> {
        const host = normalizeHost((this.options.host as string | undefined) ?? "https://api.provable.com");
        const net = (this.options.network as string | undefined) ?? normalizeNetwork(network);
        const headers = (this.options.headers as Record<string, string> | undefined) ?? {};
        const res = await fetch(`${host}/scanner/${net}/records/owned`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`NetworkRecordProvider.getRecords failed (${res.status})`);
        return res.json();
      }
    },
    encryptAuthorization(publicKey: string, authorization: unknown): string {
      return sealMessageBase64(publicKey, toLeBytes(authorization));
    },
    encryptProvingRequest(publicKey: string, provingRequest: unknown): string {
      return sealMessageBase64(publicKey, toLeBytes(provingRequest));
    },
    encryptRegistrationRequest(publicKey: string, viewKey: unknown, start: number): string {
      const vkBytes = toLeBytes(viewKey);
      const combined = new Uint8Array(vkBytes.length + 4);
      combined.set(vkBytes, 0);
      const view = new DataView(combined.buffer);
      view.setUint32(vkBytes.length, parseNumber(start), true);
      return sealMessageBase64(publicKey, combined);
    },
    highLevel: {
      createAccount(params?: { privateKey?: string }): unknown {
        return new Account(params);
      },
      createProgramManager(hostOrOptions?: string | Record<string, unknown>): unknown {
        const host =
          typeof hostOrOptions === "string"
            ? hostOrOptions
            : (hostOrOptions?.host as string | undefined);
        const keyProvider = typeof hostOrOptions === "object" ? hostOrOptions.keyProvider : undefined;
        return {
          async buildExecutionTransaction(options: any) {
            return wasm.ProgramManager.buildExecutionTransaction(
              options.privateKey,
              options.program ?? options.programName,
              options.functionName,
              options.inputs ?? [],
              parseNumber(options.priorityFee ?? 0),
              options.privateFee ? maybeRecord(options.feeRecord, wasm) : undefined,
              normalizeHost(host),
              options.imports,
              options.provingKey,
              options.verifyingKey,
              undefined,
              undefined,
              options.offlineQuery,
              options.edition,
            );
          },
          async provingRequest(options: any) {
            return wasm.ProgramManager.buildProvingRequest(
              options.privateKey,
              options.programSource ?? options.programName,
              options.functionName,
              options.inputs ?? [],
              parseNumber(options.baseFee ?? 0),
              parseNumber(options.priorityFee ?? 0),
              options.privateFee ? maybeRecord(options.feeRecord, wasm) : undefined,
              options.programImports,
              Boolean(options.broadcast),
              Boolean(options.unchecked),
              options.edition,
              options.useFeeMaster ?? true,
            );
          },
          async buildFeeAuthorization(options: any) {
            return wasm.ProgramManager.authorizeFee(
              options.privateKey,
              options.deploymentOrExecutionId,
              parseNumber(options.baseFeeCredits ?? 0),
              parseNumber(options.priorityFeeCredits ?? 0),
              options.feeRecord ? maybeRecord(options.feeRecord, wasm) : undefined,
            );
          },
          async estimateExecutionFee(options: any) {
            return wasm.ProgramManager.estimateExecutionFee(
              options.program ?? options.programName,
              options.functionName,
              options.imports,
              options.edition,
            );
          },
          async estimateDeploymentFee(program: string, imports?: Record<string, string>) {
            return wasm.ProgramManager.estimateDeploymentFee(program, imports);
          },
          async estimateFeeForAuthorization(program: string, imports: any, authorization: any) {
            return wasm.ProgramManager.estimateFeeForAuthorization(
              authorization,
              program,
              typeof imports === "object" ? imports : undefined,
            );
          },
          keyProvider,
        };
      },
      createKeyProvider(): unknown {
        const provider = new wasm.AleoKeyProvider();
        provider.useCache?.(true);
        return provider;
      },
      verifyProof(options: { verifyingKey: string; inputs: string[]; proof: string }): boolean {
        if (!wasm.Proof || !wasm.VerifyingKey || !wasm.snarkVerify) {
          throw new Error("Proof verification is not available in this runtime.");
        }
        return wasm.snarkVerify(
          wasm.VerifyingKey.fromString(options.verifyingKey),
          options.inputs,
          wasm.Proof.fromString(options.proof),
        );
      },
    },
  };
}

