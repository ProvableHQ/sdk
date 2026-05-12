import "dotenv/config";
import {
    Account,
    ProgramManager,
    Program,
    initThreadPool,
    AleoKeyProvider,
    AleoNetworkClient,
    RecordScanner,
    RecordCiphertext,
    OfflineQuery,
} from "@provablehq/sdk/testnet.js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Initialize the thread pool to speed up proving.
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
 * Result of splitting a card into two.
 */
export interface SplitResult {
    keptCard: LoyaltyCard;
    splitCard: LoyaltyCard;
}

/**
 * Result of redeeming points for a voucher.
 */
export interface RedeemResult {
    card: LoyaltyCard;
    voucher: RewardVoucher;
}

/**
 * Configuration for program execution.
 */
export interface ProgramConfig {
    provingMode?: ProvingMode;
    /** RecordScanner service URL. */
    recordScannerUrl?: string;
    /** API key or JWT for RecordScanner (for RSS scanner). */
    recordScannerApiKey?: string;
    /** Provable API consumer ID (used for both DPS and RSS). */
    consumerId?: string;
    dpsUrl?: string;
    dpsApiKey?: string;
    /** Enable encrypted DPS flow (TEE-protected proving). */
    dpsPrivacy?: boolean;
}

// ============================================================================
// Logging Utilities
// ============================================================================

const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
};

function logHeader(title: string): void {
    console.log(`\n${COLORS.cyan}╔${"═".repeat(58)}╗${COLORS.reset}`);
    console.log(`${COLORS.cyan}║${COLORS.bright}  ${title.padEnd(56)}${COLORS.reset}${COLORS.cyan}║${COLORS.reset}`);
    console.log(`${COLORS.cyan}╚${"═".repeat(58)}╝${COLORS.reset}`);
}

function logConfig(provingMode: ProvingMode, hasRecordScanner: boolean, dpsPrivacy: boolean): void {
    console.log(`${COLORS.dim}┌──────────────────────────────────────────────────────────┐${COLORS.reset}`);
    const provingModeStr = provingMode === ProvingMode.Local
        ? `${COLORS.green}LOCAL${COLORS.reset}`
        : `${COLORS.magenta}DELEGATED${COLORS.reset}${dpsPrivacy ? ` ${COLORS.cyan}(encrypted)${COLORS.reset}` : ''}`;
    console.log(`${COLORS.dim}│${COLORS.reset} Proving Mode:    ${provingModeStr}`.padEnd(78) + `${COLORS.dim}│${COLORS.reset}`);
    const scannerStr = hasRecordScanner
        ? `${COLORS.magenta}RSS${COLORS.reset} ${COLORS.cyan}(encrypted)${COLORS.reset}`
        : `${COLORS.yellow}DISABLED${COLORS.reset}`;
    console.log(`${COLORS.dim}│${COLORS.reset} Record Scanner:  ${scannerStr}`.padEnd(78) + `${COLORS.dim}│${COLORS.reset}`);
    console.log(`${COLORS.dim}└──────────────────────────────────────────────────────────┘${COLORS.reset}`);
    if (provingMode === ProvingMode.Delegated) {
        console.log(`${COLORS.yellow}⚠  Note: Delegated proving requires programs to be deployed on-chain.${COLORS.reset}`);
        console.log(`${COLORS.yellow}   Use ALEO_PROVING_MODE=local for undeployed programs.${COLORS.reset}`);
    }
}

function logModeChange(mode: ProvingMode): void {
    const modeStr = mode === ProvingMode.Local ? "LOCAL" : "DELEGATED";
    const color = mode === ProvingMode.Local ? COLORS.green : COLORS.magenta;
    console.log(`\n${COLORS.yellow}🔄 Switching to ${color}${modeStr}${COLORS.reset}${COLORS.yellow} proving mode${COLORS.reset}`);
    if (mode === ProvingMode.Delegated) {
        console.log(`   ${COLORS.dim}└─ Proving requests will be sent to a remote prover${COLORS.reset}`);
    } else {
        console.log(`   ${COLORS.dim}└─ Proving will be performed locally on this machine${COLORS.reset}`);
    }
}

function logOperation(operation: string, mode: ProvingMode): void {
    const modeStr = mode === ProvingMode.Local ? "LOCAL" : "DELEGATED";
    const color = mode === ProvingMode.Local ? COLORS.green : COLORS.magenta;
    console.log(`\n${COLORS.blue}⏱  ${operation}${COLORS.reset} ${COLORS.dim}(${color}${modeStr}${COLORS.reset}${COLORS.dim} proving)${COLORS.reset}`);
}

function logOperationComplete(operation: string, durationMs: number, mode: ProvingMode): void {
    const modeStr = mode === ProvingMode.Local ? "local" : "delegated";
    console.log(`   ${COLORS.dim}└─${COLORS.reset} ${COLORS.green}✓${COLORS.reset} ${operation} completed in ${COLORS.bright}${(durationMs / 1000).toFixed(1)}s${COLORS.reset} ${COLORS.dim}(${modeStr})${COLORS.reset}`);
}

function logScanStart(program: string, recordType: string, startHeight: number, endHeight?: number): void {
    const range = endHeight ? `${startHeight}-${endHeight}` : `${startHeight}+`;
    console.log(`\n${COLORS.blue}🔍 Scanning for ${COLORS.bright}${recordType}${COLORS.reset}${COLORS.blue} records${COLORS.reset}`);
    console.log(`   ${COLORS.dim}├─ Program: ${program}${COLORS.reset}`);
    console.log(`   ${COLORS.dim}└─ Block range: ${range}${COLORS.reset}`);
}

function logScanResults(recordType: string, count: number): void {
    if (count > 0) {
        console.log(`   ${COLORS.green}✓${COLORS.reset} Found ${COLORS.bright}${count}${COLORS.reset} ${recordType} record${count !== 1 ? "s" : ""}`);
    } else {
        console.log(`   ${COLORS.yellow}○${COLORS.reset} No ${recordType} records found`);
    }
}

// ============================================================================
// LoyaltyProgram Class
// ============================================================================

/**
 * A class that wraps the loyalty_token.aleo and loyalty_rewards.aleo programs.
 *
 * Provides methods for all loyalty program functions:
 * - mintCard: Create a new loyalty card with hash-generated unique ID
 * - addPoints: Add points to an existing card (consumes old, creates new)
 * - checkPoints: View card points without consuming
 * - transferCard: Transfer card to another address
 * - splitCardV2: Split a card into two with deterministic nonce
 * - redeemForVoucher: Exchange points for a reward voucher (multi-program)
 * - useVoucher: Consume a voucher
 * - transferVoucher: Transfer voucher to another address
 *
 * Optional features:
 * - Delegated Proving: Set provingMode to "delegated" to offload proving
 * - Record Scanner: Use findMyCards() and findMyVouchers() to discover records
 *
 * @example
 * const loyalty = new LoyaltyProgram(account, { provingMode: ProvingMode.Local });
 * loyalty.setPrograms(tokenProgram, rewardsProgram);
 *
 * const card = await loyalty.mintCard("aleo1...", 1000);
 * const updatedCard = await loyalty.addPoints(card, 500);
 * const { card: newCard, voucher } = await loyalty.redeemForVoucher(updatedCard, RewardType.Discount, 200);
 */
class LoyaltyProgram {
    private programManager: ProgramManager;
    private keyProvider: AleoKeyProvider;
    private networkClient: AleoNetworkClient | null = null;
    private _account: Account;

    // Program sources
    private tokenProgram: string = "";
    private rewardsProgram: string = "";

    // Program IDs
    private readonly TOKEN_PROGRAM_ID = "loyalty_token.aleo";
    private readonly REWARDS_PROGRAM_ID = "loyalty_rewards.aleo";

    // Feature configuration
    private _provingMode: ProvingMode = ProvingMode.Local;
    private _recordScanner: RecordScanner | null = null;
    private _dpsUrl?: string;
    private _dpsApiKey?: string;
    private _consumerId?: string;
    private _dpsPrivacy: boolean = false;

    // Transaction confirmation polling configuration
    private readonly TX_POLL_INTERVAL_MS = 5000;
    private readonly TX_TIMEOUT_MS = 300000; // 5 minutes

    /**
     * Create a new LoyaltyProgram instance.
     *
     * @param account - The Aleo account to use for transactions
     * @param config - Optional configuration for proving mode and record scanner
     */
    constructor(account: Account, config?: ProgramConfig) {
        this._account = account;
        // Always use the standard API endpoint for ProgramManager state queries
        // (edition lookups, inclusion proofs, etc.). The DPS URL is only needed for
        // submitProvingRequest() — passing it here doubles the /testnet/ path segment.
        this.programManager = new ProgramManager("https://api.provable.com/v2");
        this.programManager.setAccount(account);

        this.keyProvider = new AleoKeyProvider();
        this.programManager.setKeyProvider(this.keyProvider);

        if (config?.dpsUrl) {
            this.networkClient = new AleoNetworkClient(config.dpsUrl);
        }

        // Apply configuration.
        if (config?.provingMode) {
            this._provingMode = config.provingMode;
        }

        // Configure RecordScanner if URL is provided.
        if (config?.recordScannerUrl) {
            const apiKeyConfig = config.recordScannerApiKey?.startsWith("eyJ")
                ? { header: "Authorization", value: `Bearer ${config.recordScannerApiKey}` }
                : config.recordScannerApiKey;
            this._recordScanner = new RecordScanner({
                url: config.recordScannerUrl,
                apiKey: apiKeyConfig,
            });
        }

        if (config?.dpsUrl) {
            this._dpsUrl = config.dpsUrl;
        }
        if (config?.dpsApiKey) {
            this._dpsApiKey = config.dpsApiKey;
        }
        if (config?.consumerId) {
            this._consumerId = config.consumerId;
        }
        if (config?.dpsPrivacy) {
            this._dpsPrivacy = config.dpsPrivacy;
        }
    }

    /**
     * Get the account associated with this instance.
     */
    public get account(): Account {
        return this._account;
    }

    /**
     * Get the current proving mode.
     */
    get provingMode(): ProvingMode {
        return this._provingMode;
    }

    /**
     * Check if a record scanner is configured.
     */
    get hasRecordScanner(): boolean {
        return this._recordScanner !== null;
    }

    /**
     * Set the proving mode (local or delegated).
     *
     * @param mode - The proving mode to use
     *
     * @example
     * loyalty.setProvingMode(ProvingMode.Delegated);
     */
    setProvingMode(mode: ProvingMode): void {
        if (mode !== this._provingMode) {
            logModeChange(mode);
        }
        this._provingMode = mode;
    }

    /**
     * Configure the RSS record scanner for discovering records on-chain.
     *
     * @param scanner - The RecordScanner instance to use
     *
     * @example
     * const scanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
     * loyalty.setRecordScanner(scanner);
     */
    setRecordScanner(scanner: RecordScanner): void {
        this._recordScanner = scanner;
        console.log(`${COLORS.green}✓${COLORS.reset} Record Scanner configured`);
    }

    /**
     * Set the program sources for execution.
     *
     * @param tokenProgram - The loyalty_token.aleo program source
     * @param rewardsProgram - The loyalty_rewards.aleo program source
     */
    setPrograms(tokenProgram: string, rewardsProgram: string): void {
        this.tokenProgram = tokenProgram;
        this.rewardsProgram = rewardsProgram;
    }

    // ==========================================================================
    // Record Discovery (using RecordScanner)
    // ==========================================================================

    /**
     * Find LoyaltyCard records owned by this account using the RecordScanner service.
     *
     * @param startHeight - The block height to start scanning from.
     * @param endHeight - Optional end block height (defaults to latest).
     * @returns Array of LoyaltyCard records.
     *
     * @example
     * const cards = await loyalty.findMyCards(0);
     * console.log(`Found ${cards.length} cards`);
     */
    async findMyCards(startHeight: number = 0, endHeight?: number): Promise<LoyaltyCard[]> {
        if (!this._recordScanner) {
            throw new Error("No record scanner configured. Use setRecordScanner() to configure.");
        }

        logScanStart(this.TOKEN_PROGRAM_ID, "LoyaltyCard", startHeight, endHeight);

        // Register with the scanner.
        await this._recordScanner.registerEncrypted(this._account.viewKey(), startHeight);

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

        const cards = records
            .filter((r) => r.record_name === "LoyaltyCard" && (r.record_plaintext || r.record_ciphertext))
            .map((r) => {
                if (r.record_plaintext) {
                    return this.parseCard(r.record_plaintext);
                }
                const ciphertext = RecordCiphertext.fromString(r.record_ciphertext!);
                const plaintext = ciphertext.decrypt(this._account.viewKey());
                return this.parseCard(plaintext.toString());
            });

        logScanResults("LoyaltyCard", cards.length);
        return cards;
    }

    /**
     * Find RewardVoucher records owned by this account using the RecordScanner service.
     *
     * @param startHeight - The block height to start scanning from.
     * @param endHeight - Optional end block height (defaults to latest).
     * @returns Array of RewardVoucher records.
     *
     * @example
     * const vouchers = await loyalty.findMyVouchers(0);
     * console.log(`Found ${vouchers.length} vouchers`);
     */
    async findMyVouchers(startHeight: number = 0, endHeight?: number): Promise<RewardVoucher[]> {
        if (!this._recordScanner) {
            throw new Error("No record scanner configured. Use setRecordScanner() to configure.");
        }

        logScanStart(this.REWARDS_PROGRAM_ID, "RewardVoucher", startHeight, endHeight);

        // Register with the scanner.
        await this._recordScanner.registerEncrypted(this._account.viewKey(), startHeight);

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

        const vouchers = records
            .filter((r) => r.record_name === "RewardVoucher" && (r.record_plaintext || r.record_ciphertext))
            .map((r) => {
                if (r.record_plaintext) {
                    return this.parseVoucher(r.record_plaintext);
                }
                const ciphertext = RecordCiphertext.fromString(r.record_ciphertext!);
                const plaintext = ciphertext.decrypt(this._account.viewKey());
                return this.parseVoucher(plaintext.toString());
            });

        logScanResults("RewardVoucher", vouchers.length);
        return vouchers;
    }

    // ==========================================================================
    // Card Operations (loyalty_token.aleo)
    // ==========================================================================

    /**
     * Mint a new loyalty card with hash-generated unique ID.
     *
     * @param recipient - The address to receive the card.
     * @param initialPoints - Starting points on the card.
     * @param nonce - Optional nonce for uniqueness (auto-generated if not provided).
     * @returns The newly minted LoyaltyCard.
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
     * @param card - The card to add points to.
     * @param pointsToAdd - Number of points to add.
     * @returns The updated LoyaltyCard with new points and potentially upgraded tier.
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
     * @param card - The card to check.
     * @returns The same card (for chaining) and points value.
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
     * @param card - The card to transfer.
     * @param newOwner - The address of the new owner.
     * @returns The transferred card with new owner.
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

    /**
     * Split a loyalty card into two cards with a deterministic nonce.
     * Uses BHP256 hash of the record for the split card's ID, preventing
     * caller-provided nonce manipulation.
     *
     * @param card - The card to split.
     * @param pointsToKeep - Points to retain on the original card.
     * @returns Object containing the kept card and the new split card.
     *
     * @example
     * const { keptCard, splitCard } = await loyalty.splitCardV2(card, 3000);
     * console.log(`Kept: ${keptCard.points}, Split: ${splitCard.points}`);
     */
    async splitCardV2(card: LoyaltyCard, pointsToKeep: number): Promise<SplitResult> {
        if (pointsToKeep >= card.points) {
            throw new Error(
                `pointsToKeep (${pointsToKeep}) must be less than card points (${card.points})`
            );
        }

        const inputs = [card.raw, `${pointsToKeep}u64`];

        const outputs = await this.execute(
            this.tokenProgram,
            "split_card_v2",
            inputs
        );

        return {
            keptCard: this.parseCard(outputs[0]),
            splitCard: this.parseCard(outputs[1]),
        };
    }

    // ==========================================================================
    // Voucher Operations (loyalty_rewards.aleo)
    // ==========================================================================

    /**
     * Redeem points for a reward voucher.
     * This is a cross-program operation that consumes points and creates a voucher.
     *
     * @param card - The card to redeem points from.
     * @param rewardType - Type of reward (Discount, Freebie, or Upgrade).
     * @param pointsCost - Number of points to spend.
     * @returns Object containing updated card and new voucher.
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

        const outputs = await this.execute(
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
     * @param voucher - The voucher to use.
     */
    async useVoucher(voucher: RewardVoucher): Promise<void> {
        const inputs = [voucher.raw];

        await this.execute(
            this.rewardsProgram,
            "use_voucher",
            inputs,
            { [this.TOKEN_PROGRAM_ID]: this.tokenProgram }
        );
    }

    /**
     * Check voucher details without consuming.
     *
     * @param voucher - The voucher to check.
     * @returns The voucher with its type and value.
     */
    async checkVoucher(
        voucher: RewardVoucher
    ): Promise<{ voucher: RewardVoucher; rewardType: RewardType; value: number }> {
        const inputs = [voucher.raw];

        const outputs = await this.execute(
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
     * @param voucher - The voucher to transfer.
     * @param newOwner - The address of the new owner.
     * @returns The transferred voucher.
     */
    async transferVoucher(
        voucher: RewardVoucher,
        newOwner: string
    ): Promise<RewardVoucher> {
        const inputs = [voucher.raw, newOwner];

        const outputs = await this.execute(
            this.rewardsProgram,
            "transfer_voucher",
            inputs,
            { [this.TOKEN_PROGRAM_ID]: this.tokenProgram }
        );

        return this.parseVoucher(outputs[0]);
    }

    // ==========================================================================
    // Private Execution Methods
    // ==========================================================================

    private async execute(
        program: string,
        functionName: string,
        inputs: string[],
        imports?: Record<string, string>
    ): Promise<string[]> {
        logOperation(functionName, this._provingMode);
        const start = Date.now();

        let outputs: string[];

        if (this._provingMode === ProvingMode.Delegated) {
            outputs = await this.executeDelegated(program, functionName, inputs, imports);
        } else {
            outputs = await this.executeLocal(program, functionName, inputs, imports);
        }

        logOperationComplete(functionName, Date.now() - start, this._provingMode);
        return outputs;
    }

    private async executeLocal(
        program: string,
        functionName: string,
        inputs: string[],
        imports?: Record<string, string>
    ): Promise<string[]> {
        // Use OfflineQuery with mock state to prevent network lookups for locally-created records.
        const offlineQuery = new OfflineQuery(
            0,
            "sr1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gk0xu"
        );

        const executionResponse = await this.programManager.run(
            program,
            functionName,
            inputs,
            false,      // proveExecution
            imports,
            undefined,  // keySearchParams
            undefined,  // provingKey
            undefined,  // verifyingKey
            undefined,  // privateKey
            offlineQuery
        );

        return executionResponse.getOutputs();
    }

    /**
     * Wait for a transaction to be confirmed on-chain.
     *
     * @param txId - The transaction ID to wait for
     * @returns The confirmed transaction
     */
    private async waitForTransaction(txId: string): Promise<any> {
        const startTime = Date.now();
        const shortId = txId.slice(0, 16);

        console.log(`   ${COLORS.dim}├─ Broadcasting: ${shortId}...${COLORS.reset}`);

        // Use explorer API for transaction lookups (not DPS).
        const explorerClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");

        while (Date.now() - startTime < this.TX_TIMEOUT_MS) {
            try {
                const tx = await explorerClient.getTransaction(txId);
                if (tx) {
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                    // Clear the "Waiting for confirmation..." line before printing
                    process.stdout.write("\r\x1b[K");
                    console.log(`   ${COLORS.dim}├─ Confirmed in ${elapsed}s${COLORS.reset}`);
                    return tx;
                }
            } catch {
                // Transaction not found yet, continue polling.
            }

            // Log progress every poll.
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            process.stdout.write(`   ${COLORS.dim}├─ Waiting for confirmation... (${elapsed}s)\r${COLORS.reset}`);

            await new Promise(resolve => setTimeout(resolve, this.TX_POLL_INTERVAL_MS));
        }

        throw new Error(`Transaction ${txId} not confirmed within ${this.TX_TIMEOUT_MS / 1000}s`);
    }

    private async executeDelegated(
        program: string,
        functionName: string,
        inputs: string[],
        imports?: Record<string, string>
    ): Promise<string[]> {
        if (!this._dpsUrl) {
            throw new Error(
                "Delegated proving requires dpsUrl to be configured. " +
                "Pass dpsUrl in the config or use setProvingMode(ProvingMode.Local)."
            );
        }

        // Get program name from source.
        const programName = Program.fromString(program).id();

        // Build the proving request with broadcast: true to submit to chain.
        const provingRequest = await this.programManager.provingRequest({
            programName,
            programSource: program,
            programImports: imports,
            functionName,
            inputs,
            priorityFee: 0,
            privateFee: false,
            broadcast: true,
        });

        // Submit to DPS (with optional encryption via dpsPrivacy flag).
        if (!this.networkClient) {
            this.networkClient = new AleoNetworkClient(this._dpsUrl);
        }

        if (this._dpsPrivacy) {
            console.log(`   ${COLORS.dim}├─ Using encrypted DPS flow (TEE-protected)${COLORS.reset}`);
        }

        const response = await this.networkClient.submitProvingRequest({
            provingRequest,
            url: this._dpsUrl,
            apiKey: this._dpsApiKey,
            consumerId: this._consumerId,
            dpsPrivacy: this._dpsPrivacy,
        });

        // Wait for transaction confirmation and extract outputs.
        const txId = response.transaction?.id;
        if (!txId) {
            throw new Error("DPS response did not contain a transaction ID");
        }

        const confirmedTx = await this.waitForTransaction(txId);
        return this.extractOutputsFromTransaction(confirmedTx);
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
                            if (output.type === "record" && output.value.startsWith("record1")) {
                                const ciphertext = RecordCiphertext.fromString(output.value);
                                // Only decrypt records owned by this account (e.g. transfers produce records for other owners).
                                if (ciphertext.isOwner(this._account.viewKey())) {
                                    const plaintext = ciphertext.decrypt(this._account.viewKey());
                                    outputs.push(plaintext.toString());
                                }
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

    // ==========================================================================
    // Parsing Helpers
    // ==========================================================================

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

    private parseRecordFields(recordString: string): Record<string, string> {
        const fields: Record<string, string> = {};
        const matches = recordString.matchAll(/(\w+):\s*([^,}]+)/g);

        for (const match of matches) {
            const [, key, value] = match;
            fields[key.trim()] = value.trim();
        }

        return fields;
    }

    private parseU64(value: string): number {
        const match = value.match(/(\d+)u64/);
        return match ? parseInt(match[1], 10) : 0;
    }

    private parseU8(value: string): number {
        const match = value.match(/(\d+)u8/);
        return match ? parseInt(match[1], 10) : 0;
    }

    private cleanAddress(value: string): string {
        return value.replace(/\.private$/, "").trim();
    }

    private cleanField(value: string): string {
        return value.replace(/field\.private$/, "field").trim();
    }
}

// ============================================================================
// Demo: Using the LoyaltyProgram class
// ============================================================================

// Get current directory for loading Leo programs.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the Leo programs.
const tokenProgramPath = join(__dirname, "../loyalty_token/build/main.aleo");
const rewardsProgramPath = join(__dirname, "../loyalty_rewards/build/main.aleo");

const tokenProgram = readFileSync(tokenProgramPath, "utf-8").trim();
const rewardsProgram = readFileSync(rewardsProgramPath, "utf-8").trim();

// Validate programs can be parsed.
console.log("\nValidating programs...");
try {
    const parsedToken = Program.fromString(tokenProgram);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Token program: ${parsedToken.id()}`);
} catch (e) {
    console.error(`  ${COLORS.yellow}✗${COLORS.reset} Failed to parse token program:`, e);
}
try {
    const parsedRewards = Program.fromString(rewardsProgram);
    console.log(`  ${COLORS.green}✓${COLORS.reset} Rewards program: ${parsedRewards.id()}`);
} catch (e) {
    console.error(`  ${COLORS.yellow}✗${COLORS.reset} Failed to parse rewards program:`, e);
}

// Read configuration from environment.
// Environment variables:
//   ALEO_CONSUMER_ID     - Provable API consumer ID (used for both DPS and RSS)
//   ALEO_PROVING_MODE    - "local" (default) or "delegated"
//   ALEO_DPS_URL         - Delegated Proving Service URL (e.g., "https://api.provable.com/prove/testnet")
//   ALEO_DPS_API_KEY     - API key for DPS authentication
//   ALEO_DPS_PRIVACY     - "true" to enable encrypted DPS flow (TEE-protected)
//   ALEO_SCAN_START_HEIGHT - Block height to start scanning from (default: 0)
//   ALEO_RSS_URL         - Record Scanning Service URL (e.g., "https://api.provable.com/scanner")
//   ALEO_RSS_API_KEY     - JWT token for RSS authentication (optional if using ALEO_CONSUMER_ID)
const consumerId = process.env.ALEO_CONSUMER_ID;
const provingMode = process.env.ALEO_PROVING_MODE === "delegated"
    ? ProvingMode.Delegated
    : ProvingMode.Local;
const dpsUrl = process.env.ALEO_DPS_URL;
const dpsApiKey = process.env.ALEO_DPS_API_KEY;
const dpsPrivacy = process.env.ALEO_DPS_PRIVACY === "true";
const recordScannerUrl = process.env.ALEO_RSS_URL;
let recordScannerApiKey = process.env.ALEO_RSS_API_KEY;
const scanStartHeight = parseInt(process.env.ALEO_SCAN_START_HEIGHT ?? "0", 10);

// Derive JWT endpoint from DPS URL base (e.g., "https://api.provable.com/prove/testnet" -> "https://api.provable.com")
function getApiBaseUrl(): string {
    if (dpsUrl) {
        try {
            const url = new URL(dpsUrl);
            return `${url.protocol}//${url.host}`;
        } catch {
            // Fall back to default if URL parsing fails.
        }
    }
    return "https://api.provable.com";
}

// If we have a consumer ID but no JWT, fetch the JWT from the Provable API.
async function fetchRssJwt(): Promise<string | undefined> {
    // Skip if no consumer ID or API key.
    if (!consumerId || !dpsApiKey) return recordScannerApiKey;
    // Skip if already have a JWT token.
    if (recordScannerApiKey?.startsWith("eyJ")) return recordScannerApiKey;

    const baseUrl = getApiBaseUrl();
    try {
        const response = await fetch(`${baseUrl}/jwts/${consumerId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Provable-API-Key": dpsApiKey,
            },
        });
        if (!response.ok) {
            const status = response.status;
            if (status === 401 || status === 403) {
                console.error(`${COLORS.yellow}⚠${COLORS.reset}  Failed to fetch RSS JWT: Invalid API key`);
                console.error(`   ${COLORS.dim}Check that ALEO_DPS_API_KEY is correct${COLORS.reset}`);
            } else if (status === 404) {
                console.error(`${COLORS.yellow}⚠${COLORS.reset}  Failed to fetch RSS JWT: Consumer ID not found`);
                console.error(`   ${COLORS.dim}Check that ALEO_CONSUMER_ID is correct${COLORS.reset}`);
            } else {
                console.error(`${COLORS.yellow}⚠${COLORS.reset}  Failed to fetch RSS JWT: HTTP ${status}`);
            }
            return recordScannerApiKey;
        }
        // JWT is returned in the Authorization header as "Bearer <token>".
        const authHeader = response.headers.get("authorization");
        if (!authHeader) {
            console.error(`${COLORS.yellow}⚠${COLORS.reset}  Failed to fetch RSS JWT: No token in response`);
            return recordScannerApiKey;
        }
        const jwt = authHeader.replace(/^Bearer\s+/i, "");
        console.log(`${COLORS.green}✓${COLORS.reset} Fetched RSS JWT token`);
        return jwt;
    } catch (error) {
        console.error(`${COLORS.yellow}⚠${COLORS.reset}  Failed to fetch RSS JWT: ${error}`);
        console.error(`   ${COLORS.dim}Check your network connection${COLORS.reset}`);
        return recordScannerApiKey;
    }
}

// Use demo account - this account has existing records on-chain for demonstration.
const accountCiphertext =
    "ciphertext1qvq283j7ujnhz59d4rnu772rfmvf94039x9ekhk2lzuutteqzlghsr3g9824qgw97a79mmdymqdt0ulqdkahq39vnerw2tl7thvvnnunq386jzjnw29e0ghnq7unphgdzw637q3fgvvlkrcywsc5jukkdhss5qq3njp";
const account = Account.fromCiphertext(accountCiphertext, "provablealeo1");

// Fetch RSS JWT if consumer ID is provided.
if (consumerId) {
    recordScannerApiKey = await fetchRssJwt();
}

// Create the LoyaltyProgram instance with configuration.
const loyalty = new LoyaltyProgram(account, {
    provingMode,
    recordScannerUrl,
    recordScannerApiKey,
    dpsUrl,
    dpsApiKey,
    consumerId,
    dpsPrivacy,
});
loyalty.setPrograms(tokenProgram, rewardsProgram);

// Get the account address.
const address = account.address().to_string();

// Display configuration.
logHeader("Aleo Loyalty Program Demo");
logConfig(loyalty.provingMode, loyalty.hasRecordScanner, dpsPrivacy);

// Demo functions.
const functions: Record<string, () => Promise<void>> = {
    // Mint a new loyalty card with 1000 initial points.
    mint_card: async () => {
        logHeader("Minting Loyalty Card");
        const card = await loyalty.mintCard(address, 1000);
        console.log(`\n${COLORS.green}✓${COLORS.reset} Card minted successfully!`);
        console.log(`  ${COLORS.dim}├─${COLORS.reset} Owner: ${card.owner.slice(0, 20)}...`);
        console.log(`  ${COLORS.dim}├─${COLORS.reset} Card ID: ${card.cardId.slice(0, 20)}...`);
        console.log(`  ${COLORS.dim}├─${COLORS.reset} Points: ${COLORS.bright}${card.points}${COLORS.reset}`);
        console.log(`  ${COLORS.dim}└─${COLORS.reset} Tier: ${COLORS.bright}${CardTier[card.tier]}${COLORS.reset}`);
    },

    // Add points to a card (mints a new card first for demo).
    add_points: async () => {
        logHeader("Adding Points to Card");
        console.log("\nStep 1: Minting initial card with 500 points...");
        const card = await loyalty.mintCard(address, 500);
        console.log(`  ${COLORS.dim}└─${COLORS.reset} Initial points: ${card.points}`);

        console.log("\nStep 2: Adding 600 points...");
        const updatedCard = await loyalty.addPoints(card, 600);
        console.log(`  ${COLORS.dim}├─${COLORS.reset} New points: ${COLORS.bright}${updatedCard.points}${COLORS.reset}`);
        console.log(`  ${COLORS.dim}└─${COLORS.reset} Tier changed: ${CardTier[card.tier]} → ${COLORS.bright}${CardTier[updatedCard.tier]}${COLORS.reset}`);
    },

    // Redeem points for a voucher.
    redeem_for_voucher: async () => {
        logHeader("Redeeming Points for Voucher");
        console.log("\nStep 1: Minting card with 1000 points...");
        const card = await loyalty.mintCard(address, 1000);

        console.log("\nStep 2: Redeeming 500 points for Discount voucher...");
        const result = await loyalty.redeemForVoucher(
            card,
            RewardType.Discount,
            500
        );

        console.log(`\n${COLORS.green}✓${COLORS.reset} Redemption successful!`);
        console.log(`  ${COLORS.dim}├─${COLORS.reset} Card points remaining: ${COLORS.bright}${result.card.points}${COLORS.reset}`);
        console.log(`  ${COLORS.dim}├─${COLORS.reset} Voucher type: ${COLORS.bright}${RewardType[result.voucher.rewardType]}${COLORS.reset}`);
        console.log(`  ${COLORS.dim}├─${COLORS.reset} Voucher value: ${COLORS.bright}${result.voucher.value}${COLORS.reset}`);
        console.log(`  ${COLORS.dim}└─${COLORS.reset} Voucher ID: ${result.voucher.voucherId.slice(0, 20)}...`);
    },

    // Full flow: mint -> add points -> redeem -> use voucher.
    full_flow: async () => {
        logHeader("Full Loyalty Program Flow");

        console.log("\n1. Minting initial card with 100 points...");
        let card = await loyalty.mintCard(address, 100);
        console.log(`   ${COLORS.dim}└─${COLORS.reset} Points: ${card.points}, Tier: ${CardTier[card.tier]}`);

        console.log("\n2. Adding 900 points (should upgrade to Silver)...");
        card = await loyalty.addPoints(card, 900);
        console.log(`   ${COLORS.dim}└─${COLORS.reset} Points: ${COLORS.bright}${card.points}${COLORS.reset}, Tier: ${COLORS.bright}${CardTier[card.tier]}${COLORS.reset}`);

        console.log("\n3. Adding 9900 points (should upgrade to Gold)...");
        card = await loyalty.addPoints(card, 9900);
        console.log(`   ${COLORS.dim}└─${COLORS.reset} Points: ${COLORS.bright}${card.points}${COLORS.reset}, Tier: ${COLORS.bright}${CardTier[card.tier]}${COLORS.reset}`);

        console.log("\n4. Splitting card (keep 3000, split off 7900)...");
        const { keptCard, splitCard } = await loyalty.splitCardV2(card, 3000);
        console.log(`   ${COLORS.dim}├─${COLORS.reset} Kept card:  ${COLORS.bright}${keptCard.points}${COLORS.reset} points, Tier: ${COLORS.bright}${CardTier[keptCard.tier]}${COLORS.reset}`);
        console.log(`   ${COLORS.dim}└─${COLORS.reset} Split card: ${COLORS.bright}${splitCard.points}${COLORS.reset} points, Tier: ${COLORS.bright}${CardTier[splitCard.tier]}${COLORS.reset}`);

        console.log("\n5. Redeeming 2000 points from kept card for Upgrade voucher...");
        const { card: updatedCard, voucher } = await loyalty.redeemForVoucher(
            keptCard,
            RewardType.Upgrade,
            2000
        );
        console.log(`   ${COLORS.dim}├─${COLORS.reset} Card points remaining: ${COLORS.bright}${updatedCard.points}${COLORS.reset}`);
        console.log(`   ${COLORS.dim}└─${COLORS.reset} Voucher: ${RewardType[voucher.rewardType]}, value: ${voucher.value}`);

        console.log("\n6. Using the voucher...");
        await loyalty.useVoucher(voucher);
        console.log(`   ${COLORS.green}✓${COLORS.reset} Voucher consumed successfully!`);
    },

    // Demonstrate proving mode switching.
    demo_modes: async () => {
        logHeader("Proving Mode Demonstration");

        console.log("\nCurrently using:", loyalty.provingMode.toUpperCase(), "proving");

        // Local mode demo.
        loyalty.setProvingMode(ProvingMode.Local);
        console.log("\nMinting card with LOCAL proving...");
        const localCard = await loyalty.mintCard(address, 500);
        console.log(`  ${COLORS.dim}└─${COLORS.reset} Card minted: ${localCard.points} points`);

        // Note: Delegated mode requires DPS configuration.
        if (dpsUrl) {
            loyalty.setProvingMode(ProvingMode.Delegated);
            console.log("\nMinting card with DELEGATED proving...");
            const delegatedCard = await loyalty.mintCard(address, 500);
            console.log(`  ${COLORS.dim}└─${COLORS.reset} Card minted: ${delegatedCard.points} points`);
        } else {
            console.log(`\n${COLORS.yellow}⚠${COLORS.reset}  Delegated proving skipped (ALEO_DPS_URL not set)`);
        }

        // Reset to original mode.
        loyalty.setProvingMode(provingMode);
    },

    // Demonstrate record scanning (requires RecordScanner configuration).
    demo_scanner: async () => {
        logHeader("Record Scanner Demonstration");

        if (!loyalty.hasRecordScanner) {
            console.log(`\n${COLORS.yellow}⚠${COLORS.reset}  Record Scanner not configured`);
            console.log(`   ${COLORS.dim}Set ALEO_RSS_URL to enable this feature${COLORS.reset}`);
            return;
        }

        console.log(`\nScanning from block ${COLORS.bright}${scanStartHeight}${COLORS.reset}...`);
        console.log(`   ${COLORS.dim}(Set ALEO_SCAN_START_HEIGHT to change)${COLORS.reset}`);

        console.log("\nSearching for your LoyaltyCard records...");
        const cards = await loyalty.findMyCards(scanStartHeight);
        for (const card of cards) {
            console.log(`  ${COLORS.dim}├─${COLORS.reset} Card: ${card.points} points (${CardTier[card.tier]})`);
        }

        console.log("\nSearching for your RewardVoucher records...");
        const vouchers = await loyalty.findMyVouchers(scanStartHeight);
        for (const voucher of vouchers) {
            console.log(`  ${COLORS.dim}├─${COLORS.reset} Voucher: ${RewardType[voucher.rewardType]}, value: ${voucher.value}`);
        }
    },

    // =========================================================================
    // Simple command aliases for easier CLI usage.
    // Run with: npm run local, npm run delegated, npm run scanner
    // =========================================================================

    // Run full_flow with local proving (ignores ALEO_PROVING_MODE env var).
    local: async () => {
        loyalty.setProvingMode(ProvingMode.Local);
        await functions.full_flow();
    },

    // Run full_flow with delegated proving.
    // Requires: ALEO_DPS_URL, ALEO_DPS_API_KEY
    delegated: async () => {
        if (!dpsUrl) {
            console.error(`\n${COLORS.yellow}⚠${COLORS.reset}  Delegated proving requires ALEO_DPS_URL`);
            console.error(`   Example: ALEO_DPS_URL=https://api.provable.com/prove/testnet npm run delegated\n`);
            process.exit(1);
        }
        if (!dpsApiKey) {
            console.error(`\n${COLORS.yellow}⚠${COLORS.reset}  Delegated proving requires ALEO_DPS_API_KEY`);
            console.error(`   Get an API key from https://provable.com\n`);
            process.exit(1);
        }
        loyalty.setProvingMode(ProvingMode.Delegated);
        await functions.full_flow();
    },

    // Alias for demo_scanner using RSS (RecordScanner service).
    // Requires: ALEO_RSS_URL + (ALEO_CONSUMER_ID or ALEO_RSS_API_KEY)
    scanner: async () => {
        if (!recordScannerUrl) {
            console.error(`\n${COLORS.yellow}⚠${COLORS.reset}  RSS scanner requires ALEO_RSS_URL`);
            console.error(`   Example: ALEO_RSS_URL=https://api.provable.com/scanner npm run scanner\n`);
            process.exit(1);
        }
        if (!recordScannerApiKey && !consumerId) {
            console.error(`\n${COLORS.yellow}⚠${COLORS.reset}  RSS scanner requires ALEO_CONSUMER_ID or ALEO_RSS_API_KEY`);
            console.error(`   Set ALEO_CONSUMER_ID to fetch JWT automatically\n`);
            process.exit(1);
        }
        await functions.demo_scanner();
    },
};

async function main() {
    const selected = process.argv[2];

    if (selected && !functions[selected]) {
        console.error(`Unknown function: ${selected}`);
        console.error(`Available: ${Object.keys(functions).join(", ")}`);
        process.exit(1);
    }

    const toRun = selected ? { [selected]: functions[selected] } : { full_flow: functions.full_flow };

    for (const [, fn] of Object.entries(toRun)) {
        await fn();
    }

    console.log(`\n${COLORS.green}✓${COLORS.reset} Demo complete!\n`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

export { LoyaltyProgram };
