import { bech32m } from "@scure/base";
import sodium from "libsodium-wrappers-sumo";

type WasmLike = Record<string, any>;

type KeyRef = { provingKey?: any; verifyingKey?: any };

const ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";

await sodium.ready;

function getBase64Variant() {
  const variants = (sodium as any).base64_variants ?? {};
  return variants.ORIGINAL ?? variants.ORIGINAL_NO_PADDING ?? variants.URLSAFE_NO_PADDING;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

function stripNumericSuffix(value: string, suffix: string): string {
  const trimmed = value.trim();
  const raw = trimmed.endsWith(suffix) ? trimmed.slice(0, -suffix.length) : trimmed;
  if (!/^\d+$/.test(raw)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return raw;
}

function toUint8Array(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (typeof value === "string") {
    return new TextEncoder().encode(value);
  }
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
  const variants = getBase64Variant();
  const fromBase64 = (sodium as any).from_base64.bind(sodium);
  const toBase64 = (sodium as any).to_base64.bind(sodium);
  let publicKey: Uint8Array;
  try {
    publicKey = fromBase64(publicKeyB64, variants);
  } catch {
    const cleaned = publicKeyB64.replace(/-/g, "+").replace(/_/g, "/");
    publicKey = fromBase64(cleaned, variants);
  }
  const sealed = (sodium as any).crypto_box_seal(message, publicKey);
  return toBase64(sealed, variants);
}

function maybeRecord(record: any, wasm: WasmLike): any {
  if (!record) return undefined;
  if (typeof record === "string" && wasm.RecordPlaintext?.fromString) {
    return wasm.RecordPlaintext.fromString(record);
  }
  return record;
}

export function createNativeBindings(wasm: WasmLike, defaultNetwork: string) {
  class Account {
    readonly innerPrivateKey: any;
    readonly innerAddress: any;

    constructor(params: { privateKey?: string | any } = {}) {
      if (typeof params.privateKey === "string") {
        this.innerPrivateKey = wasm.PrivateKey.from_string(params.privateKey);
      } else if (params.privateKey) {
        this.innerPrivateKey = params.privateKey;
      } else {
        this.innerPrivateKey = new wasm.PrivateKey();
      }
      this.innerAddress = this.innerPrivateKey.to_address();
    }

    privateKey(): any {
      return this.innerPrivateKey;
    }

    address(): any {
      return this.innerAddress;
    }

    toString(): string {
      return this.innerAddress?.to_string?.() ?? "";
    }

    viewKey(): any {
      return this.innerPrivateKey?.to_view_key?.();
    }

    static recordPlaintextFromString(record: string): { asString: () => Promise<string>; toString: () => string; inner: any } {
      const inner =
        wasm.RecordPlaintext?.fromString?.(record) ??
        wasm.RecordPlaintext?.from_string?.(record) ??
        record;
      return {
        inner,
        toString: () => inner?.toString?.() ?? String(inner ?? ""),
        async asString() {
          return inner?.toString?.() ?? String(inner ?? "");
        },
      };
    }
  }

  class AleoKeyProviderParams {
    readonly cacheKey?: string;
    constructor(params: { cacheKey?: string } = {}) {
      this.cacheKey = params.cacheKey;
    }
  }

  class AleoKeyProvider {
    readonly keyMap = new Map<string, KeyRef>();
    cacheOption = false;

    useCache(value: boolean): void {
      this.cacheOption = value;
    }

    cacheKeys(_program: string, _fn: string, keypair: any): void {
      const k = `${_program}:${_fn}`;
      this.keyMap.set(k, {
        provingKey: keypair?.provingKey?.() ?? keypair?.provingKey ?? keypair?.getProvingKey?.(),
        verifyingKey: keypair?.verifyingKey?.() ?? keypair?.verifyingKey ?? keypair?.getVerifyingKey?.(),
      });
    }

    async functionKeys(params?: AleoKeyProviderParams): Promise<KeyRef> {
      if (!params?.cacheKey) return {};
      return this.keyMap.get(params.cacheKey) ?? {};
    }

    set(cacheKey: string, provingKey: any, verifyingKey: any): void {
      this.keyMap.set(cacheKey, { provingKey, verifyingKey });
    }
  }

  class OfflineKeyProvider extends AleoKeyProvider {
    insertFunctionKeys(cacheKey: string, provingKey: any, verifyingKey: any): void {
      this.set(cacheKey, provingKey, verifyingKey);
    }
  }

  class OfflineSearchParams {
    static bondPublicKeyParams() {
      return new AleoKeyProviderParams({ cacheKey: CREDITS_PROGRAM_KEYS.bond_public.locator });
    }
    static unbondPublicKeyParams() {
      return new AleoKeyProviderParams({ cacheKey: CREDITS_PROGRAM_KEYS.unbond_public.locator });
    }
    static claimUnbondPublicKeyParams() {
      return new AleoKeyProviderParams({ cacheKey: CREDITS_PROGRAM_KEYS.claim_unbond_public.locator });
    }
  }

  class AleoNetworkClient {
    readonly host: string;
    account?: Account;
    readonly options: Record<string, unknown>;
    constructor(host: string, options: Record<string, unknown> = {}) {
      this.host = host.replace(/\/+$/, "");
      this.options = options;
    }

    async get(path: string): Promise<any> {
      const res = await fetch(`${this.host}${path}`);
      if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
      return res.json();
    }

    async post(path: string, body: any): Promise<any> {
      const res = await fetch(`${this.host}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `POST ${path} failed (${res.status})`);
      }
      return res.json();
    }

    async submitTransaction(transaction: any): Promise<string> {
      const payload = typeof transaction === "string" ? transaction : transaction?.toString?.() ?? transaction;
      const out = await this.post(`/${defaultNetwork}/transaction/broadcast`, payload);
      return out?.transactionId ?? out?.tx_id ?? out ?? "";
    }

    setAccount(account: Account): void {
      this.account = account;
    }

    async getLatestHeight(): Promise<number> {
      const value = await this.get(`/${defaultNetwork}/block/height/latest`);
      const n = Number(value);
      if (Number.isFinite(n)) return n;
      throw new Error(`Invalid block height response: ${String(value)}`);
    }

    async getProgram(programId: string): Promise<string> {
      return this.get(`/${defaultNetwork}/program/${encodeURIComponent(programId)}`);
    }

    async getProgramImports(program: string): Promise<Record<string, string>> {
      let imports: string[] = [];
      try {
        const parsed = wasm.Program?.fromString?.(program);
        const values = parsed?.getImports?.() ?? [];
        imports = values.map((x: any) => x?.toString?.() ?? x?.to_string?.() ?? String(x));
      } catch {
        imports = [];
      }

      const collected: Record<string, string> = {};
      const visited = new Set<string>();
      const queue = [...imports];

      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const source = await this.getProgram(id);
        collected[id] = source;

        try {
          const parsed = wasm.Program?.fromString?.(source);
          const nested = parsed?.getImports?.() ?? [];
          for (const n of nested) {
            const name = n?.toString?.() ?? n?.to_string?.() ?? String(n);
            if (!visited.has(name)) queue.push(name);
          }
        } catch {
          // ignore malformed import program content
        }
      }

      return collected;
    }

    async waitForTransactionConfirmation(txId: string, timeoutMs = 120_000): Promise<any> {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const tx = await this.getTransaction(txId);
        if (tx?.type === "AcceptedDeploy" || tx?.type === "AcceptedExecute" || tx?.status === "accepted") {
          return tx;
        }
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
      throw new Error(`Timed out waiting for transaction ${txId}`);
    }

    async getTransaction(txId: string): Promise<any> {
      return this.get(`/${defaultNetwork}/transaction/${txId}`);
    }

    async getProgramMappingValue(programId: string, mapping: string, key: string): Promise<any> {
      return this.get(`/${defaultNetwork}/program/${programId}/mapping/${mapping}/${encodeURIComponent(key)}`);
    }

    async submitProvingRequest(body: any): Promise<any> {
      return this.post("/proving/execute", body);
    }
  }

  class NetworkRecordProvider {
    constructor(public readonly account: Account, public readonly networkClient: AleoNetworkClient) {}
  }

  class RecordScanner {
    readonly host: string;
    readonly network: string;
    readonly headers: Record<string, string>;
    constructor(params: { host?: string; network?: string; headers?: Record<string, string> } = {}) {
      this.host = (params.host ?? "https://api.provable.com").replace(/\/+$/, "");
      this.network = params.network ?? defaultNetwork;
      this.headers = params.headers ?? {};
    }

    async post(path: string, body: unknown): Promise<any> {
      const res = await fetch(`${this.host}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.headers },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`RecordScanner request failed (${res.status}): ${await res.text()}`);
      }
      return res.json();
    }

    async get(path: string): Promise<any> {
      const res = await fetch(`${this.host}${path}`, {
        method: "GET",
        headers: this.headers,
      });
      if (!res.ok) throw new Error(`RecordScanner request failed (${res.status}): ${await res.text()}`);
      return res.json();
    }

    async getPublicKey(): Promise<any> {
      return this.get(`/scanner/${this.network}/pubkey`);
    }

    async registerEncrypted(keyId: string, ciphertext: string): Promise<any> {
      return this.post(`/scanner/${this.network}/register/encrypted`, { key_id: keyId, ciphertext });
    }

    async getOwnedRecords(payload: unknown): Promise<any> {
      return this.post(`/scanner/${this.network}/records/owned`, payload);
    }

    async getRecordTags(payload: unknown): Promise<any> {
      return this.post(`/scanner/${this.network}/records/tags`, payload);
    }

    async getSyncStatus(uuid: string): Promise<any> {
      return this.post(`/scanner/${this.network}/status`, uuid);
    }
  }

  class DynamicRecord {
    readonly inner: any;
    constructor(inner: any) {
      this.inner = inner;
    }
    static fromRecord(record: any): DynamicRecord {
      return new DynamicRecord(record);
    }
    static fromString(record: string): DynamicRecord {
      if (wasm.RecordPlaintext?.fromString) {
        return new DynamicRecord(wasm.RecordPlaintext.fromString(record));
      }
      return new DynamicRecord(record);
    }
    owner(): any {
      return this.inner?.owner?.();
    }
    toString(): string {
      return this.inner?.toString?.() ?? String(this.inner ?? "");
    }
  }

  class ProgramManager {
    account: Account | undefined;
    keyProvider: AleoKeyProvider | OfflineKeyProvider | undefined;
    networkClient: AleoNetworkClient;
    constructor(
      hostOrOptions:
        | string
        | {
            host?: string;
            keyProvider?: AleoKeyProvider;
            recordProvider?: NetworkRecordProvider;
            account?: Account;
          } = "https://api.provable.com/v2",
      keyProvider?: AleoKeyProvider,
      recordProvider?: NetworkRecordProvider,
    ) {
      if (typeof hostOrOptions === "string") {
        this.networkClient = new AleoNetworkClient(hostOrOptions);
        this.keyProvider = keyProvider;
        if (recordProvider?.account) this.account = recordProvider.account;
      } else {
        this.networkClient = new AleoNetworkClient(hostOrOptions.host ?? "https://api.provable.com/v2");
        this.keyProvider = hostOrOptions.keyProvider;
        if (hostOrOptions.recordProvider?.account) this.account = hostOrOptions.recordProvider.account;
        if (hostOrOptions.account) this.account = hostOrOptions.account;
      }
    }

    setAccount(account: Account): void {
      this.account = account;
    }

    setKeyProvider(provider: AleoKeyProvider): void {
      this.keyProvider = provider;
    }

    async setInclusionProver(): Promise<void> {
      return;
    }

    creditsProgram(): { toString: () => string } {
      return { toString: () => "credits.aleo" };
    }

    requirePrivateKey(privateKey?: any): any {
      const pk = privateKey ?? this.account?.privateKey?.();
      if (!pk) throw new Error("ProgramManager requires an account or explicit private key");
      return pk;
    }

    async synthesizeKeys(program: string, functionName: string, inputs: any[]): Promise<any> {
      const keyPair = await wasm.ProgramManager.synthesizeKeyPair(
        this.requirePrivateKey(),
        program,
        functionName,
        inputs,
      );
      return keyPair;
    }

    verifyExecution(_executionResponse: any, _maxTransitions?: number): boolean {
      return true;
    }

    async run(program: string, functionName: string, inputs: any[], proveExecution = true): Promise<any> {
      return wasm.ProgramManager.executeFunctionOffline(
        this.requirePrivateKey(),
        program,
        functionName,
        inputs,
        proveExecution,
        true,
      );
    }

    async deploy(
      program: string,
      priorityFee: number | bigint,
      privateFeeOrRecordSearchParams?: boolean | any,
      _recordSearchParams?: any,
      feeRecord?: any,
      privateKey?: any,
    ): Promise<string> {
      const privateFee = typeof privateFeeOrRecordSearchParams === "boolean" ? privateFeeOrRecordSearchParams : false;
      const tx = await wasm.ProgramManager.buildDeploymentTransaction(
        this.requirePrivateKey(privateKey),
        program,
        parseNumber(priorityFee),
        privateFee ? maybeRecord(feeRecord, wasm) : undefined,
        this.networkClient.host,
      );
      return this.networkClient.submitTransaction(tx);
    }

    async buildDeploymentTransaction(programOrOptions: any, priorityFee?: number, privateFee = false): Promise<any> {
      const opts =
        typeof programOrOptions === "object"
          ? programOrOptions
          : { program: programOrOptions, priorityFee, privateFee };
      return wasm.ProgramManager.buildDeploymentTransaction(
        this.requirePrivateKey(opts.privateKey),
        opts.program,
        opts.priorityFee ?? 0,
        opts.privateFee ? maybeRecord(opts.feeRecord, wasm) : undefined,
        this.networkClient.host,
        opts.imports,
      );
    }

    async buildExecutionTransaction(options: any): Promise<any> {
      const keySearchParams = options.keySearchParams;
      const keys =
        options.provingKey || options.verifyingKey
          ? { provingKey: options.provingKey, verifyingKey: options.verifyingKey }
          : await this.keyProvider?.functionKeys?.(keySearchParams);
      return wasm.ProgramManager.buildExecutionTransaction(
        this.requirePrivateKey(options.privateKey),
        options.program ?? options.programName,
        options.functionName,
        options.inputs ?? [],
        options.priorityFee ?? 0,
        options.privateFee ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
        options.imports,
        keys?.provingKey,
        keys?.verifyingKey,
        undefined,
        undefined,
        options.offlineQuery,
        options.edition,
      );
    }

    async buildTransferPublicAsSignerTransaction(
      recipient: string,
      amount: number,
      _fee: number,
      _unused?: any,
      fee: number = 0,
      options: any = {},
    ): Promise<any> {
      return wasm.ProgramManager.buildTransferTransaction(
        this.requirePrivateKey(options.privateKey),
        amount,
        recipient,
        "public_as_signer",
        options.amountRecord ? maybeRecord(options.amountRecord, wasm) : undefined,
        fee,
        options.feeRecord ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
        options.provingKey,
        options.verifyingKey,
      );
    }

    async buildBondPublicTransaction(staker: string, validator: string, amount: number, fee: number, options: any = {}): Promise<any> {
      return wasm.ProgramManager.buildExecutionTransaction(
        this.requirePrivateKey(options.privateKey),
        "credits.aleo",
        "bond_public",
        [staker, validator, `${amount}u64`],
        fee,
        options.feeRecord ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
        undefined,
        options.provingKey,
        options.verifyingKey,
      );
    }

    async buildUnbondPublicTransaction(staker: string, amount: number, fee: number, options: any = {}): Promise<any> {
      return wasm.ProgramManager.buildExecutionTransaction(
        this.requirePrivateKey(options.privateKey),
        "credits.aleo",
        "unbond_public",
        [staker, `${amount}u64`],
        fee,
        options.feeRecord ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
      );
    }

    async buildClaimUnbondPublicTransaction(staker: string, fee: number, options: any = {}): Promise<any> {
      return wasm.ProgramManager.buildExecutionTransaction(
        this.requirePrivateKey(options.privateKey),
        "credits.aleo",
        "claim_unbond_public",
        [staker],
        fee,
        options.feeRecord ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
      );
    }

    async buildDevnodeDeploymentTransaction(options: any): Promise<any> {
      return wasm.ProgramManager.buildDevnodeDeploymentTransaction(
        this.requirePrivateKey(options.privateKey),
        options.program,
        options.priorityFee ?? 0,
        options.privateFee ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
        options.imports,
      );
    }

    async buildDevnodeUpgradeTransaction(options: any): Promise<any> {
      return wasm.ProgramManager.buildDevnodeUpgradeTransaction(
        this.requirePrivateKey(options.privateKey),
        options.program,
        options.priorityFee ?? 0,
        options.privateFee ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
        options.imports,
      );
    }

    async buildDevnodeExecutionTransaction(options: any): Promise<any> {
      return wasm.ProgramManager.buildDevnodeExecutionTransaction(
        this.requirePrivateKey(options.privateKey),
        options.program ?? options.programName,
        options.functionName,
        options.inputs ?? [],
        options.priorityFee ?? 0,
        options.privateFee ? maybeRecord(options.feeRecord, wasm) : undefined,
        this.networkClient.host,
        options.imports,
        options.edition,
      );
    }

    async buildAuthorization(options: any): Promise<any> {
      return wasm.ProgramManager.authorize(
        this.requirePrivateKey(options.privateKey),
        options.programSource ?? options.programName,
        options.functionName,
        options.inputs ?? [],
        options.programImports,
        options.edition,
      );
    }

    async estimateFeeForAuthorization(_options: any): Promise<number> {
      let authorization: any;
      let program: string;
      let imports: Record<string, string> | undefined;
      let edition: number | undefined;

      if (arguments.length >= 3) {
        const [programName, maybeImportsOrProgram, auth] = arguments as unknown as [string, any, any];
        program = programName;
        authorization = auth;
        imports =
          maybeImportsOrProgram && typeof maybeImportsOrProgram === "object" && !Array.isArray(maybeImportsOrProgram)
            ? maybeImportsOrProgram
            : undefined;
      } else {
        const options = _options ?? {};
        authorization = options.authorization;
        program = options.program ?? options.programName;
        imports = options.imports;
        edition = options.edition;
      }

      if (!program) throw new Error("estimateFeeForAuthorization requires a program");
      const authObj =
        typeof authorization === "string"
          ? wasm.Authorization.fromString(authorization)
          : authorization;
      const fee = wasm.ProgramManager.estimateFeeForAuthorization(authObj, program, imports, edition);
      return Number(fee);
    }

    async estimateExecutionFee(options: { programName?: string; program?: string; functionName?: string; imports?: object; edition?: number }): Promise<bigint> {
      const program = options.program ?? options.programName;
      if (!program || !options.functionName) {
        throw new Error("estimateExecutionFee requires programName and functionName");
      }
      return wasm.ProgramManager.estimateExecutionFee(
        program,
        options.functionName,
        options.imports,
        options.edition,
      );
    }

    async estimateDeploymentFee(program: string, imports?: Record<string, string>): Promise<bigint> {
      return wasm.ProgramManager.estimateDeploymentFee(program, imports);
    }

    async buildFeeAuthorization(options: any): Promise<any> {
      return wasm.ProgramManager.authorizeFee(
        this.requirePrivateKey(options.privateKey),
        options.deploymentOrExecutionId,
        options.baseFeeCredits ?? 0,
        options.priorityFeeCredits ?? 0,
        options.feeRecord ? maybeRecord(options.feeRecord, wasm) : undefined,
      );
    }

    async buildTransactionFromAuthorization(options: any): Promise<any> {
      return wasm.ProgramManager.executeAuthorization(
        options.authorization,
        options.feeAuthorization,
        options.program ?? options.programName,
        options.provingKey,
        options.verifyingKey,
        undefined,
        undefined,
        options.imports,
        this.networkClient.host,
        options.offlineQuery,
      );
    }

    async provingRequest(options: any): Promise<any> {
      return wasm.ProgramManager.buildProvingRequest(
        this.requirePrivateKey(options.privateKey),
        options.programSource ?? options.programName,
        options.functionName,
        options.inputs ?? [],
        options.baseFee ?? 0,
        options.priorityFee ?? 0,
        options.privateFee ? maybeRecord(options.feeRecord, wasm) : undefined,
        options.programImports,
        Boolean(options.broadcast),
        Boolean(options.unchecked),
        options.edition,
        options.useFeeMaster ?? true,
      );
    }
  }

  const CREDITS_PROGRAM_KEYS = {
    fee_public: { locator: "credits.aleo/fee_public" },
    transfer_public: { locator: "credits.aleo/transfer_public" },
    transfer_private: { locator: "credits.aleo/transfer_private" },
    transfer_public_as_signer: { locator: "credits.aleo/transfer_public_as_signer" },
    bond_public: { locator: "credits.aleo/bond_public" },
    unbond_public: { locator: "credits.aleo/unbond_public" },
    claim_unbond_public: { locator: "credits.aleo/claim_unbond_public" },
    inclusion: { locator: "credits.aleo/inclusion" },
    getKey(functionName: string) {
      const key = (this as any)[functionName];
      return key ?? { locator: `credits.aleo/${functionName}` };
    },
  };

  function verifyProof(options: { verifyingKey: string; inputs: string[]; proof: string }): boolean {
    const vk = wasm.VerifyingKey.fromString(options.verifyingKey);
    const proof = wasm.Proof.fromString(options.proof);
    return wasm.snarkVerify(vk, options.inputs, proof);
  }

  function verifyBatchProof(options: { verifyingKeys: string[]; inputs: string[][][]; proof: string }): boolean {
    const keys = options.verifyingKeys.map((k) => wasm.VerifyingKey.fromString(k));
    const proof = wasm.Proof.fromString(options.proof);
    return wasm.snarkVerifyBatch(keys, options.inputs, proof);
  }

  function encryptAuthorization(publicKey: string, authorization: unknown): string {
    return sealMessageBase64(publicKey, toLeBytes(authorization));
  }

  function encryptProvingRequest(publicKey: string, provingRequest: unknown): string {
    return sealMessageBase64(publicKey, toLeBytes(provingRequest));
  }

  function encryptRegistrationRequest(publicKey: string, viewKey: unknown, start: number): string {
    const vkBytes = toLeBytes(viewKey);
    const combined = new Uint8Array(vkBytes.length + 4);
    combined.set(vkBytes, 0);
    const view = new DataView(combined.buffer);
    view.setUint32(vkBytes.length, start, true);
    return sealMessageBase64(publicKey, combined);
  }

  function parseU128(balance: string): string {
    return stripNumericSuffix(balance, "u128");
  }

  function parseU64(balance: string): string {
    return stripNumericSuffix(balance, "u64");
  }

  class SealanceMerkleTree {
    static hasher = new wasm.Poseidon4();

    convertAddressToField(address: string): bigint {
      const { words } = bech32m.decode(address as `${string}1${string}`);
      const bytes = bech32m.fromWords(words);
      let fieldValue = 0n;
      for (let i = 0; i < bytes.length; i += 1) {
        fieldValue |= BigInt(bytes[i] ?? 0) << BigInt(i * 8);
      }
      return fieldValue;
    }

    hashTwoElements(prefix: string, el1: string, el2: string): any {
      const fields = [wasm.Field.fromString(prefix), wasm.Field.fromString(el1), wasm.Field.fromString(el2)];
      const arrayPlaintext = wasm.Plaintext.fromString(`[${fields.map((f: any) => f.toString()).join(",")}]`);
      return SealanceMerkleTree.hasher.hash(arrayPlaintext.toFields());
    }

    buildTree(leaves: string[]): bigint[] {
      if (leaves.length === 0) throw new Error("Leaves array cannot be empty");
      if (leaves.length % 2 !== 0) throw new Error("Leaves array must have even number of elements");
      let currentLevel = leaves;
      let tree = [...currentLevel];
      let levelSize = currentLevel.length;
      while (levelSize > 1) {
        const nextLevel: string[] = [];
        for (let i = 0; i < levelSize; i += 2) {
          const left = currentLevel[i] ?? "";
          const right = currentLevel[i + 1] ?? "";
          const prefix = leaves.length === levelSize ? "1field" : "0field";
          const hash = this.hashTwoElements(prefix, left, right);
          nextLevel.push(hash.toString());
        }
        tree = [...tree, ...nextLevel];
        currentLevel = nextLevel;
        levelSize = currentLevel.length;
      }
      return tree.map((element) => BigInt(element.slice(0, element.length - "field".length)));
    }

    generateLeaves(addresses: string[], maxTreeDepth = 15): string[] {
      const maxNumLeaves = Math.floor(2 ** (maxTreeDepth - 1));
      const filtered = addresses.filter((addr) => addr !== ZERO_ADDRESS);
      const numLeaves =
        filtered.length <= 1 ? 2 : 2 ** Math.ceil(Math.log2(filtered.length));
      if (filtered.length > maxNumLeaves) {
        throw new Error(`Leaves limit exceeded. Max: ${maxNumLeaves}, provided: ${filtered.length}`);
      }
      const sortedFieldElements = filtered
        .map((address) => this.convertAddressToField(address))
        .sort((a, b) => (a < b ? -1 : 1))
        .map((field) => `${field.toString()}field`);
      const fullTree = Array(Math.max(numLeaves - sortedFieldElements.length, 0)).fill("0field");
      return fullTree.concat(sortedFieldElements);
    }

    getLeafIndices(merkleTree: bigint[], address: string): [number, number] {
      const numLeaves = Math.floor((merkleTree.length + 1) / 2);
      const addressBigInt = this.convertAddressToField(address);
      const leaves = merkleTree.slice(0, numLeaves);
      let rightLeafIndex = leaves.findIndex((leaf: bigint) => addressBigInt <= leaf);
      let leftLeafIndex = rightLeafIndex - 1;
      if (rightLeafIndex === -1) {
        rightLeafIndex = leaves.length - 1;
        leftLeafIndex = leaves.length - 1;
      }
      if (rightLeafIndex === 0) leftLeafIndex = 0;
      return [leftLeafIndex, rightLeafIndex];
    }

    getSiblingPath(tree: bigint[], leafIndex: number, depth: number): { siblings: bigint[]; leaf_index: number } {
      const numLeaves = Math.floor((tree.length + 1) / 2);
      const siblingPath: bigint[] = [];
      let index = leafIndex;
      let parentIndex = numLeaves;
      siblingPath.push(tree[index] ?? 0n);
      let level = 1;
      while (parentIndex < tree.length) {
        const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
        siblingPath.push(tree[siblingIndex] ?? 0n);
        index = parentIndex + Math.floor(leafIndex / 2 ** level);
        parentIndex += Math.floor(numLeaves / 2 ** level);
        level += 1;
      }
      while (level < depth) {
        siblingPath.push(0n);
        level += 1;
      }
      return { siblings: siblingPath, leaf_index: leafIndex };
    }

    formatMerkleProof(proof: { siblings: bigint[]; leaf_index: number }[]): string {
      const formatted = proof
        .map((item) => {
          const siblings = item.siblings.map((s) => `${s}field`).join(", ");
          return `{siblings: [${siblings}], leaf_index: ${item.leaf_index}u32}`;
        })
        .join(", ");
      return `[${formatted}]`;
    }
  }

  return {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoNetworkClient,
    CREDITS_PROGRAM_KEYS,
    DynamicRecord,
    Int64: wasm.I64,
    RecordScanner,
    NetworkRecordProvider,
    OfflineKeyProvider,
    OfflineSearchParams,
    ProgramManager,
    SealanceMerkleTree,
    encryptAuthorization,
    encryptProvingRequest,
    encryptRegistrationRequest,
    parseU128,
    parseU64,
    verifyBatchProof,
    verifyProof,
  };
}
