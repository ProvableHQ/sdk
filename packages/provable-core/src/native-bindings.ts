type WasmLike = Record<string, any>;

type KeyRef = { provingKey?: any; verifyingKey?: any };

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
    constructor(host: string) {
      this.host = host.replace(/\/+$/, "");
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
    constructor(host = "https://api.provable.com/v2", keyProvider?: AleoKeyProvider, _recordProvider?: NetworkRecordProvider) {
      this.networkClient = new AleoNetworkClient(host);
      this.keyProvider = keyProvider;
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

    async deploy(program: string, priorityFee: number, _recordSearchParams?: any, feeRecord?: any): Promise<string> {
      const tx = await wasm.ProgramManager.buildDeploymentTransaction(
        this.requirePrivateKey(),
        program,
        priorityFee,
        maybeRecord(feeRecord, wasm),
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
      return 0;
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

  return {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoNetworkClient,
    CREDITS_PROGRAM_KEYS,
    DynamicRecord,
    NetworkRecordProvider,
    OfflineKeyProvider,
    OfflineSearchParams,
    ProgramManager,
    verifyBatchProof,
    verifyProof,
  };
}
