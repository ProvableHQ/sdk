import "dotenv/config";
import { getContract, parseAbi } from "@aleo-viem/core";
import type { AleoAbi, ParsedRecordOutput } from "@aleo-viem/core";
import { createAleoClient } from "@aleo-viem/provable";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Types
// ============================================================================

enum RewardType {
    Discount = 1,
    Freebie = 2,
    Upgrade = 3,
}

enum CardTier {
    Bronze = 0,
    Silver = 1,
    Gold = 2,
}

interface LoyaltyCard {
    owner: string;
    cardId: string;
    points: number;
    tier: CardTier;
    raw: string;
}

interface RewardVoucher {
    owner: string;
    voucherId: string;
    rewardType: RewardType;
    value: number;
    raw: string;
}

// ============================================================================
// Setup
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load ABIs (compiler output) and program sources (needed for proving)
const tokenAbi: AleoAbi = JSON.parse(readFileSync(join(__dirname, "../loyalty_token/build/abi.json"), "utf-8"));
const rewardsAbi: AleoAbi = JSON.parse(readFileSync(join(__dirname, "../loyalty_rewards/build/abi.json"), "utf-8"));
const tokenSource = readFileSync(join(__dirname, "../loyalty_token/build/main.aleo"), "utf-8").trim();
const rewardsSource = readFileSync(join(__dirname, "../loyalty_rewards/build/main.aleo"), "utf-8").trim();

// Read configuration from environment
const provingMode = process.env.ALEO_PROVING_MODE === "delegated" ? "delegated" : "local" as const;
const networkUrl = process.env.ALEO_NETWORK_URL ?? "https://api.explorer.provable.com/v1";
const dpsUrl = process.env.ALEO_DPS_URL;
const dpsApiKey = process.env.ALEO_DPS_API_KEY;

// Demo account
const DEMO_PRIVATE_KEY = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";

// Create clients — one line replaces ProgramManager + AleoKeyProvider + AleoNetworkClient + initThreadPool
const { publicClient, walletClient, account } = createAleoClient({
    privateKey: DEMO_PRIVATE_KEY,
    networkUrl,
    provingMode,
    ...(dpsUrl && { proverUrl: dpsUrl }),
    ...(dpsApiKey && { apiKey: dpsApiKey }),
});

// Create typed contract instances — ABI enables auto-encode inputs + auto-parse outputs
const tokenContract = getContract({
    program: "loyalty_token.aleo",
    abi: parseAbi(tokenAbi),
    programSource: tokenSource,
    client: { public: publicClient, wallet: walletClient },
});

const rewardsContract = getContract({
    program: "loyalty_rewards.aleo",
    abi: parseAbi(rewardsAbi),
    programSource: rewardsSource,
    imports: { "loyalty_token.aleo": tokenSource },
    client: { public: publicClient, wallet: walletClient },
});

// ============================================================================
// Record helpers — auto-parsed outputs → typed interfaces
// ============================================================================

function toLoyaltyCard(output: ParsedRecordOutput): LoyaltyCard {
    return {
        owner: output.data.owner as string,
        cardId: String(output.data.card_id),
        points: Number(output.data.points),
        tier: Number(output.data.tier) as CardTier,
        raw: output.raw,
    };
}

function toRewardVoucher(output: ParsedRecordOutput): RewardVoucher {
    return {
        owner: output.data.owner as string,
        voucherId: String(output.data.voucher_id),
        rewardType: Number(output.data.reward_type) as RewardType,
        value: Number(output.data.amount),
        raw: output.raw,
    };
}

// ============================================================================
// Card Operations — inputs auto-encoded, outputs auto-parsed by ABI
// ============================================================================

async function mintCard(recipient: string, initialPoints: number): Promise<LoyaltyCard> {
    const nonce = Math.floor(Math.random() * 1e9);
    const { outputs } = await tokenContract.simulate.mint_card({
        inputs: [recipient, BigInt(initialPoints), BigInt(nonce)],
    });
    return toLoyaltyCard(outputs[0] as ParsedRecordOutput);
}

async function addPoints(card: LoyaltyCard, pointsToAdd: number): Promise<LoyaltyCard> {
    const { outputs } = await tokenContract.simulate.add_points({
        inputs: [card.raw, BigInt(pointsToAdd)],
    });
    return toLoyaltyCard(outputs[0] as ParsedRecordOutput);
}

async function splitCardV2(card: LoyaltyCard, pointsToKeep: number): Promise<{ keptCard: LoyaltyCard; splitCard: LoyaltyCard }> {
    if (pointsToKeep >= card.points) {
        throw new Error(`pointsToKeep (${pointsToKeep}) must be less than card points (${card.points})`);
    }
    const { outputs } = await tokenContract.simulate.split_card_v2({
        inputs: [card.raw, BigInt(pointsToKeep)],
    });
    return { keptCard: toLoyaltyCard(outputs[0] as ParsedRecordOutput), splitCard: toLoyaltyCard(outputs[1] as ParsedRecordOutput) };
}

async function transferCard(card: LoyaltyCard, newOwner: string): Promise<LoyaltyCard> {
    const { outputs } = await tokenContract.simulate.transfer_card({
        inputs: [card.raw, newOwner],
    });
    return toLoyaltyCard(outputs[0] as ParsedRecordOutput);
}

// ============================================================================
// Voucher Operations — cross-program calls use imports configured on contract
// ============================================================================

async function redeemForVoucher(
    card: LoyaltyCard,
    rewardType: RewardType,
    pointsCost: number,
): Promise<{ card: LoyaltyCard; voucher: RewardVoucher }> {
    if (card.points < pointsCost) {
        throw new Error(`Insufficient points: have ${card.points}, need ${pointsCost}`);
    }
    const { outputs } = await rewardsContract.simulate.redeem_points_for_voucher({
        inputs: [card.raw, BigInt(rewardType), BigInt(pointsCost)],
    });
    return { card: toLoyaltyCard(outputs[0] as ParsedRecordOutput), voucher: toRewardVoucher(outputs[1] as ParsedRecordOutput) };
}

async function useVoucher(voucher: RewardVoucher): Promise<void> {
    await rewardsContract.simulate.use_voucher({
        inputs: [voucher.raw],
    });
}

// ============================================================================
// Logging
// ============================================================================

const C = {
    reset: "\x1b[0m", bright: "\x1b[1m", dim: "\x1b[2m",
    cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m",
};

function logHeader(title: string): void {
    console.log(`\n${C.cyan}${"═".repeat(60)}${C.reset}`);
    console.log(`${C.cyan}  ${C.bright}${title}${C.reset}`);
    console.log(`${C.cyan}${"═".repeat(60)}${C.reset}`);
}

function logCard(card: LoyaltyCard, label?: string): void {
    if (label) console.log(`  ${C.dim}${label}${C.reset}`);
    console.log(`  ${C.dim}├─${C.reset} Points: ${C.bright}${card.points}${C.reset}, Tier: ${C.bright}${CardTier[card.tier]}${C.reset}`);
}

function logVoucher(voucher: RewardVoucher): void {
    console.log(`  ${C.dim}├─${C.reset} Type: ${C.bright}${RewardType[voucher.rewardType]}${C.reset}, Value: ${C.bright}${voucher.value}${C.reset}`);
}

// ============================================================================
// Demo
// ============================================================================

const address = account.address;

const demos: Record<string, () => Promise<void>> = {
    async full_flow() {
        logHeader("Full Loyalty Program Flow");

        console.log("\n1. Minting card with 100 points...");
        let card = await mintCard(address, 100);
        logCard(card);

        console.log("\n2. Adding 900 points (upgrade to Silver)...");
        card = await addPoints(card, 900);
        logCard(card);

        console.log("\n3. Adding 9900 points (upgrade to Gold)...");
        card = await addPoints(card, 9900);
        logCard(card);

        console.log("\n4. Splitting card (keep 3000)...");
        const { keptCard, splitCard } = await splitCardV2(card, 3000);
        logCard(keptCard, "Kept:");
        logCard(splitCard, "Split:");

        console.log("\n5. Redeeming 2000 points for Upgrade voucher...");
        const { card: updatedCard, voucher } = await redeemForVoucher(keptCard, RewardType.Upgrade, 2000);
        logCard(updatedCard, "Card after redemption:");
        logVoucher(voucher);

        console.log("\n6. Using the voucher...");
        await useVoucher(voucher);
        console.log(`  ${C.green}✓${C.reset} Voucher consumed!`);
    },

    async mint_card() {
        logHeader("Minting Loyalty Card");
        const card = await mintCard(address, 1000);
        logCard(card);
    },

    async add_points() {
        logHeader("Adding Points");
        const card = await mintCard(address, 500);
        console.log("  Initial card:");
        logCard(card);
        const updated = await addPoints(card, 600);
        console.log(`  After +600 points:`);
        logCard(updated);
    },

    async redeem_for_voucher() {
        logHeader("Redeeming Points for Voucher");
        const card = await mintCard(address, 1000);
        const { card: updated, voucher } = await redeemForVoucher(card, RewardType.Discount, 500);
        logCard(updated, "Card:");
        logVoucher(voucher);
    },

    async local() {
        await demos.full_flow();
    },

    async delegated() {
        if (!dpsUrl) {
            console.error(`\n${C.yellow}Delegated proving requires ALEO_DPS_URL${C.reset}`);
            process.exit(1);
        }
        await demos.full_flow();
    },
};

async function main() {
    const selected = process.argv[2] ?? "full_flow";
    const fn = demos[selected];

    if (!fn) {
        console.error(`Unknown command: ${selected}`);
        console.error(`Available: ${Object.keys(demos).join(", ")}`);
        process.exit(1);
    }

    console.log(`${C.dim}Mode: ${provingMode.toUpperCase()} | Account: ${address.slice(0, 20)}...${C.reset}`);
    await fn();
    console.log(`\n${C.green}✓${C.reset} Done!\n`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
