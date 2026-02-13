/**
 * Loyalty Program Worker
 *
 * Provides a clean class abstraction for the loyalty program,
 * demonstrating SDK capabilities for:
 * - Record minting and consumption.
 * - Record scanning/discovery (via RecordScanner).
 * - Record decryption.
 * - Mapping reads.
 * - Multi-program execution.
 * - Parameter/key caching for large functions.
 * - Delegated proving (optional).
 */
import {
  Account,
  ProgramManager,
  Program,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoKeyProviderParams,
  AleoNetworkClient,
  NetworkRecordProvider,
  RecordScanner,
  encryptRegistrationRequest,
  RecordCiphertext,
} from "@provablehq/sdk";
import { expose, proxy } from "comlink";

await initThreadPool();

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Proving mode for transactions
 */
export enum ProvingMode {
  Local = "local",
  Delegated = "delegated",
}

/**
 * Scanner type for record discovery
 */
export enum ScannerType {
  /** RecordScanner service (faster, requires JWT auth) */
  RSS = "rss",
  /** NetworkRecordProvider via explorer API (slower, no auth needed) */
  Network = "network",
}

/**
 * Reward types available for redemption
 */
export enum RewardType {
  Discount = 1,
  Freebie = 2,
  Upgrade = 3,
}

/**
 * Card tier levels based on points
 */
export enum CardTier {
  Bronze = 0,
  Silver = 1,
  Gold = 2,
}

/**
 * Parsed LoyaltyCard record.
 */
export interface LoyaltyCard {
  owner: string;
  cardId: string;
  points: number;
  tier: CardTier;
  raw: string; // Original record string for passing to functions.
}

/**
 * Parsed RewardVoucher record.
 */
export interface RewardVoucher {
  owner: string;
  voucherId: string;
  rewardType: RewardType;
  value: number;
  raw: string; // Original record string for passing to functions.
}

/**
 * Result of redeeming points for a voucher.
 */
export interface RedeemResult {
  card: LoyaltyCard;
  voucher: RewardVoucher;
}

/**
 * Loyalty program statistics from mappings.
 */
export interface ProgramStats {
  totalCards: number;
  totalPointsIssued: number;
  redemptionsByType: Record<RewardType, number>;
}

/**
 * Configuration for the LoyaltyProgram.
 */
export interface LoyaltyProgramConfig {
  provingMode?: ProvingMode;
  /** Scanner type: "rss" (RecordScanner) or "network" (NetworkRecordProvider). */
  scannerType?: ScannerType;
  /** RecordScanner service URL (for RSS scanner). */
  recordScannerUrl?: string;
  /** API key or JWT for RecordScanner (for RSS scanner). */
  recordScannerApiKey?: string;
  /** Explorer API URL (for Network scanner). */
  networkUrl?: string;
  dpsUrl?: string;
  dpsApiKey?: string;
  dpsConsumerId?: string;
  /** Enable encrypted DPS flow (TEE-protected proving). */
  dpsPrivacy?: boolean;
  /** Enable encrypted RSS flow (TEE-protected record scanning). */
  rssPrivacy?: boolean;
}

/**
 * Status event types for UI feedback
 */
export type StatusEventType =
  | "mode_changed"
  | "operation_start"
  | "operation_complete"
  | "scan_start"
  | "scan_complete"
  | "error";

/**
 * Status event for UI feedback
 */
export interface StatusEvent {
  type: StatusEventType;
  operation?: string;
  mode?: ProvingMode;
  duration?: number;
  count?: number;
  error?: string;
}

// ============================================================================
// LoyaltyProgram Class
// ============================================================================

/**
 * A class that wraps the loyalty_token.aleo and loyalty_rewards.aleo programs.
 *
 * Provides methods for all loyalty program functions:
 * - mintCard: Create a new loyalty card
 * - addPoints: Add points to an existing card
 * - checkPoints: View card points without consuming
 * - transferCard: Transfer card to another address
 * - redeemForVoucher: Exchange points for a reward voucher
 * - useVoucher: Consume a voucher
 * - transferVoucher: Transfer voucher to another address
 *
 * Optional features:
 * - Delegated Proving: Set provingMode to "delegated" to offload proving
 * - Record Scanner: Use findMyCards() and findMyVouchers() to discover records
 *
 * Also provides mapping read helpers:
 * - getTotalCards: Get total cards minted
 * - getTotalPointsIssued: Get total points issued
 * - cardExists: Check if a card ID exists
 * - isVoucherUsed: Check if a voucher has been used
 *
 * @example
 * // Local execution (offline)
 * const loyalty = new LoyaltyProgram();
 * loyalty.setPrograms(tokenProgram, rewardsProgram);
 * const card = await loyalty.mintCard("aleo1...", 1000);
 * const updatedCard = await loyalty.addPoints(card, 500);
 *
 * @example
 * // With delegated proving
 * const loyalty = new LoyaltyProgram(account, {
 *   provingMode: ProvingMode.Delegated,
 *   dpsUrl: "https://api.provable.com/prove/testnet"  // Include network suffix in URL
 * });
 */
class LoyaltyProgram {
  private programManager: ProgramManager;
  private keyProvider: AleoKeyProvider;
  private networkClient: AleoNetworkClient | null = null;
  private account: Account | null = null;

  // Program sources (for local execution)
  private tokenProgram: string = "";
  private rewardsProgram: string = "";

  // Program IDs
  private readonly TOKEN_PROGRAM_ID = "loyalty_token.aleo";
  private readonly REWARDS_PROGRAM_ID = "loyalty_rewards.aleo";

  // Feature configuration
  private _provingMode: ProvingMode = ProvingMode.Local;
  private _scannerType: ScannerType = ScannerType.RSS;
  private _recordScanner: RecordScanner | null = null;
  private _networkRecordProvider: NetworkRecordProvider | null = null;
  private _networkUrl?: string;
  private _dpsUrl?: string;
  private _dpsApiKey?: string;
  private _dpsConsumerId?: string;
  private _dpsPrivacy: boolean = false;
  private _rssPrivacy: boolean = false;

  // Status callback for UI updates
  private _onStatus: ((event: StatusEvent) => void) | null = null;

  /**
   * Create a new LoyaltyProgram instance.
   *
   * @param account - Optional account for network operations
   * @param config - Optional configuration for proving mode and record scanner
   */
  constructor(account?: Account, config?: LoyaltyProgramConfig) {
    const apiUrl = config?.dpsUrl;
    this.programManager = new ProgramManager(apiUrl);

    this.keyProvider = new AleoKeyProvider();
    this.keyProvider.useCache(true);
    this.programManager.setKeyProvider(this.keyProvider);

    if (account) {
      this.account = account;
      this.programManager.setAccount(account);
    }

    if (apiUrl) {
      this.networkClient = new AleoNetworkClient(apiUrl);
    }

    // Apply configuration
    if (config?.provingMode) {
      this._provingMode = config.provingMode;
    }

    if (config?.scannerType) {
      this._scannerType = config.scannerType;
    }

    // Configure scanner based on type.
    if (this._scannerType === ScannerType.RSS && config?.recordScannerUrl) {
      // RSS: RecordScanner service (faster, requires JWT auth).
      const apiKeyConfig = config.recordScannerApiKey?.startsWith("eyJ")
        ? { header: "Authorization", value: `Bearer ${config.recordScannerApiKey}` }
        : config.recordScannerApiKey;
      this._recordScanner = new RecordScanner({
        url: config.recordScannerUrl,
        apiKey: apiKeyConfig,
      });
    } else if (this._scannerType === ScannerType.Network && config?.networkUrl && account) {
      // Network: NetworkRecordProvider via explorer API (no auth needed).
      this._networkUrl = config.networkUrl;
      const networkClient = new AleoNetworkClient(config.networkUrl);
      this._networkRecordProvider = new NetworkRecordProvider(account, networkClient);
    }

    if (config?.dpsUrl) {
      this._dpsUrl = config.dpsUrl;
    }
    if (config?.dpsApiKey) {
      this._dpsApiKey = config.dpsApiKey;
    }
    if (config?.dpsConsumerId) {
      this._dpsConsumerId = config.dpsConsumerId;
    }
    if (config?.dpsPrivacy) {
      this._dpsPrivacy = config.dpsPrivacy;
    }
    if (config?.rssPrivacy) {
      this._rssPrivacy = config.rssPrivacy;
    }
  }

  /**
   * Get the current proving mode.
   */
  get provingMode(): ProvingMode {
    return this._provingMode;
  }

  /**
   * Get the current scanner type.
   */
  get scannerType(): ScannerType {
    return this._scannerType;
  }

  /**
   * Check if a record scanner is configured (RSS or Network).
   */
  get hasRecordScanner(): boolean {
    return this._recordScanner !== null || this._networkRecordProvider !== null;
  }

  /**
   * Set a callback for status events (for UI feedback).
   */
  onStatus(callback: (event: StatusEvent) => void): void {
    this._onStatus = callback;
  }

  private emitStatus(event: StatusEvent): void {
    if (this._onStatus) {
      this._onStatus(event);
    }
    // Also log to console for debugging.
    console.log(`[LoyaltyProgram] ${event.type}:`, event);
  }

  /**
   * Set the proving mode (local or delegated).
   *
   * @param mode - The proving mode to use
   */
  setProvingMode(mode: ProvingMode): void {
    if (mode !== this._provingMode) {
      this._provingMode = mode;
      this.emitStatus({ type: "mode_changed", mode });
    }
  }

  /**
   * Set the scanner type (RSS or Network).
   *
   * @param type - The scanner type to use
   */
  setScannerType(type: ScannerType): void {
    if (type !== this._scannerType) {
      this._scannerType = type;
      console.log(`[LoyaltyProgram] Scanner type changed to: ${type}`);
    }
  }

  /**
   * Configure the RSS record scanner for discovering records on-chain.
   *
   * @param url - The record scanner service URL
   * @param apiKey - Optional API key or JWT token (JWT tokens start with "eyJ")
   */
  setRecordScanner(url: string, apiKey?: string): void {
    // JWT tokens (start with "eyJ") use Authorization header.
    // Plain API keys use X-Provable-API-Key header.
    const apiKeyConfig = apiKey?.startsWith("eyJ")
      ? { header: "Authorization", value: `Bearer ${apiKey}` }
      : apiKey;
    this._recordScanner = new RecordScanner({ url, apiKey: apiKeyConfig });
    this._scannerType = ScannerType.RSS;
  }

  /**
   * Configure the Network record provider for discovering records via explorer API.
   *
   * @param networkUrl - The explorer API URL (e.g., "https://api.explorer.provable.com/v1")
   */
  setNetworkRecordProvider(networkUrl: string): void {
    if (!this.account) {
      throw new Error("Account must be set before configuring Network record provider.");
    }
    this._networkUrl = networkUrl;
    const networkClient = new AleoNetworkClient(networkUrl);
    this._networkRecordProvider = new NetworkRecordProvider(this.account, networkClient);
    this._scannerType = ScannerType.Network;
  }

  /**
   * Set the program sources for local execution.
   * Required before calling any execution methods in local mode.
   *
   * @param tokenProgram - The loyalty_token.aleo program source
   * @param rewardsProgram - The loyalty_rewards.aleo program source
   */
  setPrograms(tokenProgram: string, rewardsProgram: string): void {
    this.tokenProgram = tokenProgram;
    this.rewardsProgram = rewardsProgram;
  }

  /**
   * Set the account for transactions.
   *
   * @param account - The Aleo account to use
   */
  setAccount(account: Account): void {
    this.account = account;
    this.programManager.setAccount(account);
  }

  // ==========================================================================
  // Record Discovery (using RecordScanner)
  // ==========================================================================

  /**
   * Register with the record scanner using encrypted flow (TEE-protected).
   * This demonstrates the full encrypted registration workflow:
   * 1. GET /pubkey - Fetch the TEE's ephemeral public key
   * 2. Encrypt the view key + start block using libsodium
   * 3. POST /register/encrypted - Send encrypted registration
   *
   * @param startHeight - The block height to start scanning from
   */
  private async registerEncrypted(startHeight: number): Promise<void> {
    if (!this._recordScanner) {
      throw new Error("Record Scanner not configured.");
    }
    if (!this.account) {
      throw new Error("Account not set.");
    }

    const scannerUrl = this._recordScanner.url;
    console.log("[LoyaltyProgram] Using encrypted RSS flow (TEE-protected)");

    // Step 1: Get the TEE's ephemeral public key
    const pubkeyResponse = await fetch(`${scannerUrl}/pubkey`);
    if (!pubkeyResponse.ok) {
      throw new Error(`Failed to get scanner public key: ${pubkeyResponse.status}`);
    }
    const pubkeyData = await pubkeyResponse.json() as { key_id: string; public_key: string };

    // Step 2: Encrypt the view key and start block
    const ciphertext = encryptRegistrationRequest(
      pubkeyData.public_key,
      this.account.viewKey(),
      startHeight
    );

    // Step 3: Send encrypted registration request
    const registerResponse = await fetch(`${scannerUrl}/register/encrypted`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key_id: pubkeyData.key_id,
        ciphertext: ciphertext,
      }),
    });

    // Handle 422 (already registered) as success
    if (registerResponse.status === 422) {
      console.log("[LoyaltyProgram] View key already registered with scanner");
      return;
    }

    if (!registerResponse.ok) {
      throw new Error(`Failed to register with scanner: ${registerResponse.status}`);
    }

    const result = await registerResponse.json();
    console.log("[LoyaltyProgram] Registered with UUID:", result.uuid?.slice(0, 20) + "...");

    // Set the UUID on the scanner for subsequent queries
    await this._recordScanner.setUuid(this.account.viewKey());
  }

  /**
   * Find LoyaltyCard records owned by this account.
   * Uses either RecordScanner (RSS) or NetworkRecordProvider based on scannerType.
   *
   * @param startHeight - The block height to start scanning from
   * @param endHeight - Optional end block height (defaults to latest)
   * @returns Array of LoyaltyCard records
   */
  async findMyCards(startHeight: number = 0, endHeight?: number): Promise<LoyaltyCard[]> {
    if (!this.hasRecordScanner) {
      throw new Error(
        "No record scanner configured. Use setRecordScanner() for RSS or setNetworkRecordProvider() for Network."
      );
    }
    if (!this.account) {
      throw new Error("Account not set. Use setAccount() first.");
    }

    this.emitStatus({
      type: "scan_start",
      operation: "findMyCards",
    });

    let cards: LoyaltyCard[];

    if (this._scannerType === ScannerType.RSS && this._recordScanner) {
      // RSS: RecordScanner service.
      if (this._rssPrivacy) {
        await this.registerEncrypted(startHeight);
      } else {
        await this._recordScanner.register(this.account.viewKey(), startHeight);
      }

      const records = await this._recordScanner.findRecords({
        decrypt: true,
        unspent: true,
        filter: {
          start: startHeight,
          end: endHeight,
          program: this.TOKEN_PROGRAM_ID,
          record: "LoyaltyCard",
        },
      });

      cards = records
        .filter((r) => r.record_name === "LoyaltyCard" && (r.record_plaintext || r.record_ciphertext))
        .map((r) => {
          if (r.record_plaintext) {
            return this.parseCard(r.record_plaintext);
          }
          const ciphertext = RecordCiphertext.fromString(r.record_ciphertext!);
          const plaintext = ciphertext.decrypt(this.account!.viewKey());
          return this.parseCard(plaintext.toString());
        });
    } else if (this._scannerType === ScannerType.Network && this._networkRecordProvider) {
      // Network: NetworkRecordProvider via explorer API.
      const records = await this._networkRecordProvider.findRecords({
        unspent: true,
        startHeight,
        programName: this.TOKEN_PROGRAM_ID,
      });

      cards = records
        .filter((r) => r.record_plaintext)
        .map((r) => this.parseCard(r.record_plaintext!));
    } else {
      throw new Error("Scanner not properly configured for the selected scanner type.");
    }

    this.emitStatus({
      type: "scan_complete",
      operation: "findMyCards",
      count: cards.length,
    });

    return cards;
  }

  /**
   * Find RewardVoucher records owned by this account.
   * Uses either RecordScanner (RSS) or NetworkRecordProvider based on scannerType.
   *
   * @param startHeight - The block height to start scanning from
   * @param endHeight - Optional end block height (defaults to latest)
   * @returns Array of RewardVoucher records
   */
  async findMyVouchers(startHeight: number = 0, endHeight?: number): Promise<RewardVoucher[]> {
    if (!this.hasRecordScanner) {
      throw new Error(
        "No record scanner configured. Use setRecordScanner() for RSS or setNetworkRecordProvider() for Network."
      );
    }
    if (!this.account) {
      throw new Error("Account not set. Use setAccount() first.");
    }

    this.emitStatus({
      type: "scan_start",
      operation: "findMyVouchers",
    });

    let vouchers: RewardVoucher[];

    if (this._scannerType === ScannerType.RSS && this._recordScanner) {
      // RSS: RecordScanner service.
      if (this._rssPrivacy) {
        await this.registerEncrypted(startHeight);
      } else {
        await this._recordScanner.register(this.account.viewKey(), startHeight);
      }

      const records = await this._recordScanner.findRecords({
        decrypt: true,
        unspent: true,
        filter: {
          start: startHeight,
          end: endHeight,
          program: this.REWARDS_PROGRAM_ID,
          record: "RewardVoucher",
        },
      });

      vouchers = records
        .filter((r) => r.record_name === "RewardVoucher" && (r.record_plaintext || r.record_ciphertext))
        .map((r) => {
          if (r.record_plaintext) {
            return this.parseVoucher(r.record_plaintext);
          }
          const ciphertext = RecordCiphertext.fromString(r.record_ciphertext!);
          const plaintext = ciphertext.decrypt(this.account!.viewKey());
          return this.parseVoucher(plaintext.toString());
        });
    } else if (this._scannerType === ScannerType.Network && this._networkRecordProvider) {
      // Network: NetworkRecordProvider via explorer API.
      const records = await this._networkRecordProvider.findRecords({
        unspent: true,
        startHeight,
        programName: this.REWARDS_PROGRAM_ID,
      });

      vouchers = records
        .filter((r) => r.record_plaintext)
        .map((r) => this.parseVoucher(r.record_plaintext!));
    } else {
      throw new Error("Scanner not properly configured for the selected scanner type.");
    }

    this.emitStatus({
      type: "scan_complete",
      operation: "findMyVouchers",
      count: vouchers.length,
    });

    return vouchers;
  }

  // ==========================================================================
  // Card Operations (loyalty_token.aleo)
  // ==========================================================================

  /**
   * Mint a new loyalty card with hash-generated unique ID.
   *
   * @param recipient - The address to receive the card
   * @param initialPoints - Starting points on the card
   * @param nonce - Optional nonce for uniqueness (auto-generated if not provided)
   * @returns The newly minted LoyaltyCard
   *
   * @example
   * const card = await loyalty.mintCard("aleo1abc...xyz", 1000);
   * console.log(`Card minted with ${card.points} points`);
   */
  async mintCard(
    recipient: string,
    initialPoints: number,
    nonce?: string
  ): Promise<LoyaltyCard> {
    const actualNonce = nonce ?? Math.floor(Math.random() * 1000000000).toString();
    const inputs = [recipient, `${initialPoints}u64`, `${actualNonce}field`];

    const outputs = await this.execute(
      this.tokenProgram,
      "mint_card",
      inputs
    );

    return this.parseCard(outputs[0]);
  }

  /**
   * Add points to an existing loyalty card.
   * Consumes the old card and creates a new one with updated points.
   *
   * @param card - The card to add points to
   * @param pointsToAdd - Number of points to add
   * @returns The updated LoyaltyCard with new points and potentially upgraded tier
   *
   * @example
   * const updatedCard = await loyalty.addPoints(card, 500);
   * console.log(`New balance: ${updatedCard.points}, Tier: ${CardTier[updatedCard.tier]}`);
   */
  async addPoints(card: LoyaltyCard, pointsToAdd: number): Promise<LoyaltyCard> {
    const inputs = [card.raw, `${pointsToAdd}u64`];

    const outputs = await this.execute(
      this.tokenProgram,
      "add_points",
      inputs
    );

    return this.parseCard(outputs[0]);
  }

  /**
   * Check card points without consuming the record.
   *
   * @param card - The card to check
   * @returns The same card (for chaining) and points value
   *
   * @example
   * const { card, points } = await loyalty.checkPoints(myCard);
   */
  async checkPoints(card: LoyaltyCard): Promise<{ card: LoyaltyCard; points: number }> {
    const inputs = [card.raw];

    const outputs = await this.execute(
      this.tokenProgram,
      "check_points",
      inputs
    );

    return {
      card: this.parseCard(outputs[0]),
      points: this.parseU64(outputs[1]),
    };
  }

  /**
   * Transfer a loyalty card to a new owner.
   *
   * @param card - The card to transfer
   * @param newOwner - The address of the new owner
   * @returns The transferred card with new owner
   *
   * @example
   * const transferredCard = await loyalty.transferCard(card, "aleo1new...owner");
   */
  async transferCard(card: LoyaltyCard, newOwner: string): Promise<LoyaltyCard> {
    const inputs = [card.raw, newOwner];

    const outputs = await this.execute(
      this.tokenProgram,
      "transfer_card",
      inputs
    );

    return this.parseCard(outputs[0]);
  }

  // ==========================================================================
  // Voucher Operations (loyalty_rewards.aleo)
  // ==========================================================================

  /**
   * Redeem points for a reward voucher.
   * This is a cross-program operation that consumes points and creates a voucher.
   *
   * @param card - The card to redeem points from
   * @param rewardType - Type of reward (Discount, Freebie, or Upgrade)
   * @param pointsCost - Number of points to spend
   * @returns Object containing updated card and new voucher
   *
   * @example
   * const { card, voucher } = await loyalty.redeemForVoucher(
   *   myCard,
   *   RewardType.Discount,
   *   500
   * );
   * console.log(`Voucher value: ${voucher.value}`);
   */
  async redeemForVoucher(
    card: LoyaltyCard,
    rewardType: RewardType,
    pointsCost: number
  ): Promise<RedeemResult> {
    if (card.points < pointsCost) {
      throw new Error(
        `Insufficient points: have ${card.points}, need ${pointsCost}`
      );
    }

    const inputs = [card.raw, `${rewardType}u8`, `${pointsCost}u64`];

    // Multi-program execution requires imports.
    const outputs = await this.executeWithImports(
      this.rewardsProgram,
      "redeem_points_for_voucher",
      inputs,
      { [this.TOKEN_PROGRAM_ID]: this.tokenProgram }
    );

    return {
      card: this.parseCard(outputs[0]),
      voucher: this.parseVoucher(outputs[1]),
    };
  }

  /**
   * Use (burn) a voucher.
   * The voucher record is consumed and cannot be used again.
   *
   * @param voucher - The voucher to use
   *
   * @example
   * await loyalty.useVoucher(myVoucher);
   * console.log("Voucher redeemed!");
   */
  async useVoucher(voucher: RewardVoucher): Promise<void> {
    const inputs = [voucher.raw];

    await this.executeWithImports(
      this.rewardsProgram,
      "use_voucher",
      inputs,
      { [this.TOKEN_PROGRAM_ID]: this.tokenProgram }
    );
  }

  /**
   * Check voucher details without consuming.
   *
   * @param voucher - The voucher to check
   * @returns The voucher with its type and value
   */
  async checkVoucher(
    voucher: RewardVoucher
  ): Promise<{ voucher: RewardVoucher; rewardType: RewardType; value: number }> {
    const inputs = [voucher.raw];

    const outputs = await this.executeWithImports(
      this.rewardsProgram,
      "check_voucher",
      inputs,
      { [this.TOKEN_PROGRAM_ID]: this.tokenProgram }
    );

    return {
      voucher: this.parseVoucher(outputs[0]),
      rewardType: this.parseU8(outputs[1]) as RewardType,
      value: this.parseU64(outputs[2]),
    };
  }

  /**
   * Transfer a voucher to a new owner.
   *
   * @param voucher - The voucher to transfer
   * @param newOwner - The address of the new owner
   * @returns The transferred voucher
   */
  async transferVoucher(
    voucher: RewardVoucher,
    newOwner: string
  ): Promise<RewardVoucher> {
    const inputs = [voucher.raw, newOwner];

    const outputs = await this.executeWithImports(
      this.rewardsProgram,
      "transfer_voucher",
      inputs,
      { [this.TOKEN_PROGRAM_ID]: this.tokenProgram }
    );

    return this.parseVoucher(outputs[0]);
  }

  // ==========================================================================
  // Mapping Reads (requires network client)
  // ==========================================================================

  /**
   * Get total number of cards minted.
   *
   * @returns Total cards count, or null if not available
   */
  async getTotalCards(): Promise<number | null> {
    return this.readMappingU64(this.TOKEN_PROGRAM_ID, "total_cards", "0field");
  }

  /**
   * Get total points issued across all cards.
   *
   * @returns Total points issued, or null if not available
   */
  async getTotalPointsIssued(): Promise<number | null> {
    return this.readMappingU64(
      this.TOKEN_PROGRAM_ID,
      "total_points_issued",
      "0field"
    );
  }

  /**
   * Check if a card ID exists in the registry.
   *
   * @param cardId - The card ID to check
   * @returns true if exists, false otherwise
   */
  async cardExists(cardId: string): Promise<boolean> {
    const value = await this.readMapping(
      this.TOKEN_PROGRAM_ID,
      "card_exists",
      cardId
    );
    return value === "true";
  }

  /**
   * Check if a voucher has been used.
   *
   * @param voucherId - The voucher ID to check
   * @returns true if used, false otherwise
   */
  async isVoucherUsed(voucherId: string): Promise<boolean> {
    const value = await this.readMapping(
      this.REWARDS_PROGRAM_ID,
      "voucher_used",
      voucherId
    );
    return value === "true";
  }

  /**
   * Get redemption count for a specific reward type.
   *
   * @param rewardType - The reward type to query
   * @returns Number of redemptions, or null if not available
   */
  async getRedemptionCount(rewardType: RewardType): Promise<number | null> {
    return this.readMappingU64(
      this.REWARDS_PROGRAM_ID,
      "redemptions_by_type",
      `${rewardType}field`
    );
  }

  /**
   * Get all program statistics.
   *
   * @returns Combined stats from all mappings
   */
  async getStats(): Promise<ProgramStats> {
    const [totalCards, totalPoints, discounts, freebies, upgrades] =
      await Promise.all([
        this.getTotalCards(),
        this.getTotalPointsIssued(),
        this.getRedemptionCount(RewardType.Discount),
        this.getRedemptionCount(RewardType.Freebie),
        this.getRedemptionCount(RewardType.Upgrade),
      ]);

    return {
      totalCards: totalCards ?? 0,
      totalPointsIssued: totalPoints ?? 0,
      redemptionsByType: {
        [RewardType.Discount]: discounts ?? 0,
        [RewardType.Freebie]: freebies ?? 0,
        [RewardType.Upgrade]: upgrades ?? 0,
      },
    };
  }

  // ==========================================================================
  // Private Execution Methods
  // ==========================================================================

  private async execute(
    program: string,
    functionName: string,
    inputs: string[]
  ): Promise<string[]> {
    this.emitStatus({
      type: "operation_start",
      operation: functionName,
      mode: this._provingMode,
    });

    const start = Date.now();
    let outputs: string[];

    try {
      if (this._provingMode === ProvingMode.Delegated) {
        outputs = await this.executeDelegated(program, functionName, inputs);
      } else {
        outputs = await this.executeLocal(program, functionName, inputs);
      }

      this.emitStatus({
        type: "operation_complete",
        operation: functionName,
        mode: this._provingMode,
        duration: Date.now() - start,
      });

      return outputs;
    } catch (error: any) {
      this.emitStatus({
        type: "error",
        operation: functionName,
        error: error.message,
      });
      throw error;
    }
  }

  private async executeWithImports(
    program: string,
    functionName: string,
    inputs: string[],
    imports: Record<string, string>
  ): Promise<string[]> {
    this.emitStatus({
      type: "operation_start",
      operation: functionName,
      mode: this._provingMode,
    });

    const start = Date.now();
    let outputs: string[];

    try {
      if (this._provingMode === ProvingMode.Delegated) {
        outputs = await this.executeDelegatedWithImports(program, functionName, inputs, imports);
      } else {
        outputs = await this.executeLocalWithImports(program, functionName, inputs, imports);
      }

      this.emitStatus({
        type: "operation_complete",
        operation: functionName,
        mode: this._provingMode,
        duration: Date.now() - start,
      });

      return outputs;
    } catch (error: any) {
      this.emitStatus({
        type: "error",
        operation: functionName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute a function locally (offline).
   * Uses key caching - keys are synthesized once and reused for subsequent calls.
   */
  private async executeLocal(
    program: string,
    functionName: string,
    inputs: string[]
  ): Promise<string[]> {
    console.log(`Starting ${functionName} execution (LOCAL)`);

    // Create temporary account if none set.
    if (!this.account) {
      const tempAccount = new Account();
      this.programManager.setAccount(tempAccount);
    }

    // Get program name for cache key.
    const programName = Program.fromString(program).id();
    const cacheKey = `${programName}:${functionName}`;

    // Synthesize and cache keys if not already cached.
    // This speeds up subsequent executions of the same function.
    if (!this.keyProvider.containsKeys(cacheKey)) {
      console.log(`Synthesizing keys for ${cacheKey}...`);
      const keyPair = await this.programManager.synthesizeKeys(program, functionName, inputs);
      this.keyProvider.cacheKeys(cacheKey, keyPair);
      console.log(`Keys cached for ${cacheKey}`);
    } else {
      console.log(`Using cached keys for ${cacheKey}`);
    }

    // Execute with cached keys.
    const keySearchParams = new AleoKeyProviderParams({ cacheKey });
    const executionResponse = await this.programManager.run(
      program,
      functionName,
      inputs,
      false, // Offline mode.
      undefined,
      keySearchParams
    );

    const outputs = executionResponse.getOutputs();
    console.log("Outputs:", outputs);

    return outputs;
  }

  /**
   * Execute a function locally with program imports.
   * Uses key caching - keys are synthesized once and reused for subsequent calls.
   */
  private async executeLocalWithImports(
    program: string,
    functionName: string,
    inputs: string[],
    imports: Record<string, string>
  ): Promise<string[]> {
    console.log(`Starting ${functionName} execution with imports (LOCAL)`);

    // Create temporary account if none set.
    if (!this.account) {
      const tempAccount = new Account();
      this.programManager.setAccount(tempAccount);
    }

    // Get program name for cache key.
    const programName = Program.fromString(program).id();
    const cacheKey = `${programName}:${functionName}`;

    // Synthesize and cache keys if not already cached.
    // This speeds up subsequent executions of the same function.
    if (!this.keyProvider.containsKeys(cacheKey)) {
      console.log(`Synthesizing keys for ${cacheKey}...`);
      const keyPair = await this.programManager.synthesizeKeys(program, functionName, inputs);
      this.keyProvider.cacheKeys(cacheKey, keyPair);
      console.log(`Keys cached for ${cacheKey}`);
    } else {
      console.log(`Using cached keys for ${cacheKey}`);
    }

    // Execute with cached keys.
    const keySearchParams = new AleoKeyProviderParams({ cacheKey });
    const executionResponse = await this.programManager.run(
      program,
      functionName,
      inputs,
      false, // Offline mode.
      imports,
      keySearchParams
    );

    const outputs = executionResponse.getOutputs();
    console.log("Outputs:", outputs);

    return outputs;
  }

  /**
   * Execute a function using delegated proving.
   */
  private async executeDelegated(
    program: string,
    functionName: string,
    inputs: string[]
  ): Promise<string[]> {
    if (!this._dpsUrl) {
      throw new Error(
        "Delegated proving requires dpsUrl to be configured. " +
        "Pass dpsUrl in the config or use setProvingMode(ProvingMode.Local)."
      );
    }

    console.log(`Starting ${functionName} execution (DELEGATED)`);

    // Get program name from source.
    const programName = Program.fromString(program).id();

    // Build the proving request.
    const provingRequest = await this.programManager.provingRequest({
      programName,
      programSource: program,
      functionName,
      inputs,
      priorityFee: 0,
      privateFee: false,
      broadcast: false,
    });

    // Submit to DPS (with optional encryption via dpsPrivacy flag).
    if (!this.networkClient) {
      this.networkClient = new AleoNetworkClient(this._dpsUrl);
    }

    if (this._dpsPrivacy) {
      console.log("[LoyaltyProgram] Using encrypted DPS flow (TEE-protected)");
    }

    const response = await this.networkClient.submitProvingRequest({
      provingRequest,
      url: this._dpsUrl,
      apiKey: this._dpsApiKey,
      consumerId: this._dpsConsumerId,
      dpsPrivacy: this._dpsPrivacy,
    });

    // Extract outputs from the transaction.
    return this.extractOutputsFromTransaction(response.transaction);
  }

  /**
   * Execute a function using delegated proving with imports.
   */
  private async executeDelegatedWithImports(
    program: string,
    functionName: string,
    inputs: string[],
    imports: Record<string, string>
  ): Promise<string[]> {
    if (!this._dpsUrl) {
      throw new Error(
        "Delegated proving requires dpsUrl to be configured. " +
        "Pass dpsUrl in the config or use setProvingMode(ProvingMode.Local)."
      );
    }

    console.log(`Starting ${functionName} execution with imports (DELEGATED)`);

    // Get program name from source.
    const programName = Program.fromString(program).id();

    // Build the proving request.
    const provingRequest = await this.programManager.provingRequest({
      programName,
      programSource: program,
      programImports: imports,
      functionName,
      inputs,
      priorityFee: 0,
      privateFee: false,
      broadcast: false,
    });

    // Submit to DPS (with optional encryption via dpsPrivacy flag).
    if (!this.networkClient) {
      this.networkClient = new AleoNetworkClient(this._dpsUrl);
    }

    if (this._dpsPrivacy) {
      console.log("[LoyaltyProgram] Using encrypted DPS flow (TEE-protected)");
    }

    const response = await this.networkClient.submitProvingRequest({
      provingRequest,
      url: this._dpsUrl,
      apiKey: this._dpsApiKey,
      consumerId: this._dpsConsumerId,
      dpsPrivacy: this._dpsPrivacy,
    });

    // Extract outputs from the transaction.
    return this.extractOutputsFromTransaction(response.transaction);
  }

  private extractOutputsFromTransaction(transaction: { execution?: { transitions: Array<{ outputs?: Array<{ type?: string; value?: string }> }> } }): string[] {
    // Extract and decrypt record outputs from transaction execution.
    const outputs: string[] = [];

    if (transaction.execution?.transitions) {
      for (const transition of transaction.execution.transitions) {
        if (transition.outputs) {
          for (const output of transition.outputs) {
            if (output.value) {
              // Check if this is an encrypted record (starts with "record1").
              if (output.type === "record" && output.value.startsWith("record1") && this.account) {
                // Decrypt the record using the account's view key.
                const ciphertext = RecordCiphertext.fromString(output.value);
                const plaintext = ciphertext.decrypt(this.account.viewKey());
                outputs.push(plaintext.toString());
              } else {
                outputs.push(output.value);
              }
            }
          }
        }
      }
    }

    return outputs;
  }

  /**
   * Read a mapping value from the network.
   */
  private async readMapping(
    programId: string,
    mappingName: string,
    key: string
  ): Promise<string | null> {
    if (!this.networkClient) {
      console.warn("No network client configured for mapping reads");
      return null;
    }

    try {
      const value = await this.networkClient.getProgramMappingValue(
        programId,
        mappingName,
        key
      );
      return value;
    } catch (error) {
      console.log(`Mapping value not found: ${error}`);
      return null;
    }
  }

  /**
   * Read a u64 mapping value from the network.
   */
  private async readMappingU64(
    programId: string,
    mappingName: string,
    key: string
  ): Promise<number | null> {
    const value = await this.readMapping(programId, mappingName, key);
    if (!value) return null;
    return this.parseU64(value);
  }

  // ==========================================================================
  // Parsing Helpers
  // ==========================================================================

  /**
   * Parse a LoyaltyCard record from its string representation.
   */
  private parseCard(recordString: string): LoyaltyCard {
    const fields = this.parseRecordFields(recordString);

    return {
      owner: this.cleanAddress(fields.owner),
      cardId: this.cleanField(fields.card_id),
      points: this.parseU64(fields.points),
      tier: this.parseU8(fields.tier) as CardTier,
      raw: recordString,
    };
  }

  /**
   * Parse a RewardVoucher record from its string representation.
   */
  private parseVoucher(recordString: string): RewardVoucher {
    const fields = this.parseRecordFields(recordString);

    return {
      owner: this.cleanAddress(fields.owner),
      voucherId: this.cleanField(fields.voucher_id),
      rewardType: this.parseU8(fields.reward_type) as RewardType,
      value: this.parseU64(fields.amount),  // Leo record uses 'amount' field.
      raw: recordString,
    };
  }

  /**
   * Parse record fields from string representation.
   */
  private parseRecordFields(recordString: string): Record<string, string> {
    const fields: Record<string, string> = {};
    const matches = recordString.matchAll(/(\w+):\s*([^,}]+)/g);

    for (const match of matches) {
      const [, key, value] = match;
      fields[key.trim()] = value.trim();
    }

    return fields;
  }

  /**
   * Parse a u64 value from string (e.g., "1000u64" -> 1000).
   */
  private parseU64(value: string): number {
    const match = value.match(/(\d+)u64/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Parse a u8 value from string (e.g., "2u8" -> 2).
   */
  private parseU8(value: string): number {
    const match = value.match(/(\d+)u8/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Clean address string (remove .private suffix).
   */
  private cleanAddress(value: string): string {
    return value.replace(/\.private$/, "").trim();
  }

  /**
   * Clean field string (remove field suffix).
   */
  private cleanField(value: string): string {
    return value.replace(/field\.private$/, "field").trim();
  }
}

// ============================================================================
// Helper Functions (for backwards compatibility and utilities)
// ============================================================================

/**
 * Create a new account and return its details.
 */
async function createAccount(): Promise<{
  privateKey: string;
  viewKey: string;
  address: string;
}> {
  const account = new Account();
  return {
    privateKey: account.privateKey().to_string(),
    viewKey: account.viewKey().to_string(),
    address: account.address().to_string(),
  };
}

/**
 * Generate a new private key.
 */
async function getPrivateKey(): Promise<any> {
  const key = new PrivateKey();
  return proxy(key);
}

/**
 * Get the current block height from the network.
 */
async function getBlockHeight(apiUrl: string): Promise<number> {
  const networkClient = new AleoNetworkClient(apiUrl);
  return networkClient.getLatestHeight();
}

/**
 * Scan for records owned by an account.
 */
async function scanForRecords(
  privateKeyString: string,
  programId: string,
  startHeight: number,
  _endHeight: number,
  apiUrl: string
): Promise<string[]> {
  const networkClient = new AleoNetworkClient(apiUrl);
  const account = new Account({ privateKey: privateKeyString });
  const recordProvider = new NetworkRecordProvider(account, networkClient);

  try {
    const records = await recordProvider.findRecords({
      unspent: true,
      startHeight,
      programName: programId,
    });
    return records.map((record) => record.record_plaintext ?? "");
  } catch (error) {
    console.log(`Error scanning for records: ${error}`);
    return [];
  }
}

/**
 * Get tier name from tier value.
 */
function getTierName(tier: CardTier): string {
  return CardTier[tier] ?? "Unknown";
}

/**
 * Get reward type name from type value.
 */
function getRewardTypeName(type: RewardType): string {
  return RewardType[type] ?? "Unknown";
}

// ============================================================================
// Factory function for creating LoyaltyProgram instances in the worker
// ============================================================================

/**
 * Create a LoyaltyProgram instance configured for local execution.
 */
function createLocalLoyaltyProgram(
  tokenProgram: string,
  rewardsProgram: string
): LoyaltyProgram {
  const loyalty = new LoyaltyProgram();
  loyalty.setPrograms(tokenProgram, rewardsProgram);
  return loyalty;
}

/**
 * Create a LoyaltyProgram instance configured for network execution.
 */
function _createNetworkLoyaltyProgram(
  privateKey: string,
  apiUrl: string,
  tokenProgram: string,
  rewardsProgram: string
): LoyaltyProgram {
  const account = new Account({ privateKey });
  const loyalty = new LoyaltyProgram(account, { dpsUrl: apiUrl });
  loyalty.setPrograms(tokenProgram, rewardsProgram);
  return loyalty;
}

// ============================================================================
// Worker Instance
// ============================================================================

// Create a shared instance for the worker.
let loyaltyInstance: LoyaltyProgram | null = null;

/**
 * Initialize the loyalty program with program sources.
 */
function initLoyaltyProgram(
  tokenProgram: string,
  rewardsProgram: string,
  config?: LoyaltyProgramConfig
): void {
  if (config) {
    const account = new Account();
    loyaltyInstance = new LoyaltyProgram(account, config);
    loyaltyInstance.setPrograms(tokenProgram, rewardsProgram);
  } else {
    loyaltyInstance = createLocalLoyaltyProgram(tokenProgram, rewardsProgram);
  }
}

/**
 * Get the current loyalty program instance.
 */
function getLoyaltyProgram(): LoyaltyProgram {
  if (!loyaltyInstance) {
    throw new Error("Loyalty program not initialized. Call initLoyaltyProgram first.");
  }
  return loyaltyInstance;
}

/**
 * Get the current proving mode.
 */
function getProvingMode(): ProvingMode {
  return getLoyaltyProgram().provingMode;
}

/**
 * Set the proving mode.
 */
function setProvingMode(mode: ProvingMode): void {
  getLoyaltyProgram().setProvingMode(mode);
}

/**
 * Get the current scanner type.
 */
function getScannerType(): ScannerType {
  return getLoyaltyProgram().scannerType;
}

/**
 * Set the scanner type.
 */
function setScannerType(type: ScannerType): void {
  getLoyaltyProgram().setScannerType(type);
}

/**
 * Check if record scanner is configured.
 */
function hasRecordScanner(): boolean {
  return getLoyaltyProgram().hasRecordScanner;
}

/**
 * Configure the RSS record scanner.
 */
function setRecordScanner(url: string, apiKey?: string): void {
  getLoyaltyProgram().setRecordScanner(url, apiKey);
}

/**
 * Configure the Network record provider.
 */
function setNetworkRecordProvider(networkUrl: string): void {
  getLoyaltyProgram().setNetworkRecordProvider(networkUrl);
}

// Wrapper functions that use the shared instance
async function mintCard(
  recipient: string,
  initialPoints: number,
  nonce?: string
): Promise<LoyaltyCard> {
  return getLoyaltyProgram().mintCard(recipient, initialPoints, nonce);
}

async function addPoints(card: LoyaltyCard, pointsToAdd: number): Promise<LoyaltyCard> {
  return getLoyaltyProgram().addPoints(card, pointsToAdd);
}

async function redeemForVoucher(
  card: LoyaltyCard,
  rewardType: RewardType,
  pointsCost: number
): Promise<RedeemResult> {
  return getLoyaltyProgram().redeemForVoucher(card, rewardType, pointsCost);
}

async function useVoucher(voucher: RewardVoucher): Promise<void> {
  return getLoyaltyProgram().useVoucher(voucher);
}

async function transferCard(card: LoyaltyCard, newOwner: string): Promise<LoyaltyCard> {
  return getLoyaltyProgram().transferCard(card, newOwner);
}

async function transferVoucher(
  voucher: RewardVoucher,
  newOwner: string
): Promise<RewardVoucher> {
  return getLoyaltyProgram().transferVoucher(voucher, newOwner);
}

async function findMyCards(startHeight?: number, endHeight?: number): Promise<LoyaltyCard[]> {
  return getLoyaltyProgram().findMyCards(startHeight, endHeight);
}

async function findMyVouchers(startHeight?: number, endHeight?: number): Promise<RewardVoucher[]> {
  return getLoyaltyProgram().findMyVouchers(startHeight, endHeight);
}

// ============================================================================
// Export Worker Methods
// ============================================================================

const workerMethods = {
  // Initialization
  initLoyaltyProgram,

  // Configuration
  getProvingMode,
  setProvingMode,
  getScannerType,
  setScannerType,
  hasRecordScanner,
  setRecordScanner,
  setNetworkRecordProvider,

  // Card operations
  mintCard,
  addPoints,
  transferCard,

  // Voucher operations
  redeemForVoucher,
  useVoucher,
  transferVoucher,

  // Record discovery
  findMyCards,
  findMyVouchers,

  // Account utilities
  createAccount,
  getPrivateKey,

  // Network utilities
  getBlockHeight,
  scanForRecords,

  // Helpers
  getTierName,
  getRewardTypeName,

  // Enums (for UI)
  ProvingMode,
  ScannerType,
  RewardType,
  CardTier,
};

expose(workerMethods);

// LoyaltyProgram class and types are already exported at their declarations.
