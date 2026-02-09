//@ts-nocheck
/**
 * Loyalty Program Worker
 *
 * Provides a clean class abstraction for the loyalty program,
 * demonstrating SDK capabilities for:
 * - Record minting and consumption
 * - Record scanning/discovery
 * - Record decryption
 * - Mapping reads
 * - Multi-program execution
 * - Parameter/key caching for large functions
 */
import {
  Account,
  ProgramManager,
  PrivateKey,
  initThreadPool,
  AleoKeyProvider,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@provablehq/sdk";
import { expose, proxy } from "comlink";

await initThreadPool();

// ============================================================================
// Types and Interfaces
// ============================================================================

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
 * Parsed LoyaltyCard record
 */
export interface LoyaltyCard {
  owner: string;
  cardId: string;
  points: number;
  tier: CardTier;
  raw: string; // Original record string for passing to functions
}

/**
 * Parsed RewardVoucher record
 */
export interface RewardVoucher {
  owner: string;
  voucherId: string;
  rewardType: RewardType;
  value: number;
  raw: string; // Original record string for passing to functions
}

/**
 * Result of redeeming points for a voucher
 */
export interface RedeemResult {
  card: LoyaltyCard;
  voucher: RewardVoucher;
}

/**
 * Loyalty program statistics from mappings
 */
export interface ProgramStats {
  totalCards: number;
  totalPointsIssued: number;
  redemptionsByType: Record<RewardType, number>;
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
 * // Network execution (on-chain)
 * const account = new Account({ privateKey: "..." });
 * const loyalty = new LoyaltyProgram(account, "https://api.explorer.provable.com/v1");
 * const card = await loyalty.mintCard(account.address().to_string(), 1000);
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

  /**
   * Create a new LoyaltyProgram instance.
   *
   * @param account - Optional account for network operations
   * @param apiUrl - Optional API endpoint for network operations
   */
  constructor(account?: Account, apiUrl?: string) {
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

    const outputs = await this.executeLocal(
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

    const outputs = await this.executeLocal(
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

    const outputs = await this.executeLocal(
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

    const outputs = await this.executeLocal(
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

    // Multi-program execution requires imports
    const outputs = await this.executeLocalWithImports(
      this.rewardsProgram,
      "redeem_for_voucher",
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

    await this.executeLocalWithImports(
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

    const outputs = await this.executeLocalWithImports(
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

    const outputs = await this.executeLocalWithImports(
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

  /**
   * Execute a function locally (offline).
   */
  private async executeLocal(
    program: string,
    functionName: string,
    inputs: string[]
  ): Promise<string[]> {
    const start = Date.now();
    console.log(`Starting ${functionName} execution`);

    // Create temporary account if none set
    if (!this.account) {
      const tempAccount = new Account();
      this.programManager.setAccount(tempAccount);
    }

    const executionResponse = await this.programManager.run(
      program,
      functionName,
      inputs,
      false // offline mode
    );

    const outputs = executionResponse.getOutputs();
    console.log(`${functionName} finished in ${Date.now() - start}ms`);
    console.log("Outputs:", outputs);

    return outputs;
  }

  /**
   * Execute a function locally with program imports.
   */
  private async executeLocalWithImports(
    program: string,
    functionName: string,
    inputs: string[],
    imports: Record<string, string>
  ): Promise<string[]> {
    const start = Date.now();
    console.log(`Starting ${functionName} execution (with imports)`);

    // Create temporary account if none set
    if (!this.account) {
      const tempAccount = new Account();
      this.programManager.setAccount(tempAccount);
    }

    const executionResponse = await this.programManager.run(
      program,
      functionName,
      inputs,
      false, // offline mode
      imports
    );

    const outputs = executionResponse.getOutputs();
    console.log(`${functionName} finished in ${Date.now() - start}ms`);
    console.log("Outputs:", outputs);

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
      value: this.parseU64(fields.value),
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
  endHeight: number,
  apiUrl: string
): Promise<string[]> {
  const networkClient = new AleoNetworkClient(apiUrl);
  const account = new Account({ privateKey: privateKeyString });
  const recordProvider = new NetworkRecordProvider(account, networkClient);

  try {
    const records = await recordProvider.findRecords(
      startHeight,
      endHeight,
      true,
      [programId]
    );
    return records.map((record) => record.toString());
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
function createNetworkLoyaltyProgram(
  privateKey: string,
  apiUrl: string,
  tokenProgram: string,
  rewardsProgram: string
): LoyaltyProgram {
  const account = new Account({ privateKey });
  const loyalty = new LoyaltyProgram(account, apiUrl);
  loyalty.setPrograms(tokenProgram, rewardsProgram);
  return loyalty;
}

// ============================================================================
// Worker Instance
// ============================================================================

// Create a shared instance for the worker
let loyaltyInstance: LoyaltyProgram | null = null;

/**
 * Initialize the loyalty program with program sources.
 */
function initLoyaltyProgram(
  tokenProgram: string,
  rewardsProgram: string
): void {
  loyaltyInstance = createLocalLoyaltyProgram(tokenProgram, rewardsProgram);
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

// ============================================================================
// Export Worker Methods
// ============================================================================

const workerMethods = {
  // Initialization
  initLoyaltyProgram,

  // Card operations
  mintCard,
  addPoints,
  transferCard,

  // Voucher operations
  redeemForVoucher,
  useVoucher,
  transferVoucher,

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
  RewardType,
  CardTier,
};

expose(workerMethods);

// Export types for use in UI
export type {
  LoyaltyCard,
  RewardVoucher,
  RedeemResult,
  ProgramStats,
};

export {
  LoyaltyProgram,
  RewardType,
  CardTier,
};
