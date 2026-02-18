import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import aleoLogo from "./assets/aleo.svg";
import "./App.css";
import loyalty_token_program from "../loyalty_token/build/main.aleo?raw";
import loyalty_rewards_program from "../loyalty_rewards/build/main.aleo?raw";
import { getAleoWorker } from "./workers/AleoWorker";

// Read configuration from environment variables (Vite loads .env automatically)
const getConfig = () => {
  const provingMode = import.meta.env.VITE_ALEO_PROVING_MODE || "local";

  return {
    provingMode: provingMode as "local" | "delegated",
    // Consumer ID (used for both DPS and RSS)
    consumerId: import.meta.env.VITE_ALEO_CONSUMER_ID,
    // DPS configuration
    dpsUrl: import.meta.env.VITE_ALEO_DPS_URL,
    dpsApiKey: import.meta.env.VITE_ALEO_DPS_API_KEY,
    dpsPrivacy: import.meta.env.VITE_ALEO_DPS_PRIVACY === "true",
    // RSS configuration
    recordScannerUrl: import.meta.env.VITE_ALEO_RSS_URL,
    recordScannerApiKey: import.meta.env.VITE_ALEO_RSS_API_KEY,
    rssPrivacy: import.meta.env.VITE_ALEO_RSS_PRIVACY === "true",
  };
};

// Type definitions (matching worker types)
interface LoyaltyCard {
  owner: string;
  cardId: string;
  points: number;
  tier: number;
  raw: string;
}

interface RewardVoucher {
  owner: string;
  voucherId: string;
  rewardType: number;
  value: number;
  raw: string;
}

// Enums (matching worker enums)
const RewardType = {
  Discount: 1,
  Freebie: 2,
  Upgrade: 3,
} as const;

const CardTier = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
} as const;

// Reward type labels
const REWARD_TYPE_NAMES: Record<number, string> = {
  [RewardType.Discount]: "Discount",
  [RewardType.Freebie]: "Freebie",
  [RewardType.Upgrade]: "Upgrade",
};

// Tier names
const TIER_NAMES: Record<number, string> = {
  [CardTier.Bronze]: "Bronze",
  [CardTier.Silver]: "Silver",
  [CardTier.Gold]: "Gold",
};

function App() {
  // Initialization state
  const [initialized, setInitialized] = useState(false);

  // Account state
  const [account, setAccount] = useState<{
    privateKey: string;
    viewKey: string;
    address: string;
  } | null>(null);

  // Card state - now using typed LoyaltyCard
  const [card, setCard] = useState<LoyaltyCard | null>(null);

  // Voucher state - array to support multiple vouchers
  const [vouchers, setVouchers] = useState<RewardVoucher[]>([]);

  // UI state
  const [loading, setLoading] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Input state
  const [pointsToAdd, setPointsToAdd] = useState<number>(500);
  const [selectedRewardType, setSelectedRewardType] = useState<number>(RewardType.Discount);
  const [pointsCost, setPointsCost] = useState<number>(100);

  // Config state (for conditional UI)
  const [provingMode, setProvingMode] = useState<"local" | "delegated">("local");

  // Initialize the loyalty program on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Wait for worker to be ready
        console.log("[App] Waiting for worker to be ready...");
        const aleoWorker = await getAleoWorker();
        console.log("[App] Worker ready!");

        // Test comlink connectivity first
        console.log("[App] Testing comlink with ping...");
        const pong = await aleoWorker.ping();
        console.log("[App] Ping response:", pong);

        const config = getConfig();
        console.log("[App] Config:", config);
        console.log("[App] Calling initLoyaltyProgram...");
        await aleoWorker.initLoyaltyProgram(
          loyalty_token_program,
          loyalty_rewards_program,
          config
        );
        console.log("[App] initLoyaltyProgram completed!");
        setProvingMode(config.provingMode);

        // Auto-load account based on proving mode
        // - Delegated: use pre-funded demo account (same as Node template)
        // - Local: generate a random account (no funds needed)
        console.log("[App] Loading account...");
        const loadedAccount = config.provingMode === "delegated"
          ? await aleoWorker.loadDemoAccount()
          : await aleoWorker.createAccount();
        setAccount(loadedAccount);
        console.log("[App] Account loaded:", loadedAccount.address);

        setInitialized(true);
        const modeLabel = config.provingMode === "delegated" ? "delegated (demo account)" : "local";
        setStatus(`Ready! Using ${modeLabel} mode`);
      } catch (error) {
        console.error("[App] Init error:", error);
        setStatus(`Initialization error: ${error}`);
      }
    };
    init();
  }, []);

  // Mint a new loyalty card - clean API!
  const handleMintCard = async () => {
    if (!account) {
      setStatus("Please generate an account first");
      return;
    }

    setLoading("Minting loyalty card (this may take a moment due to hash operations)...");
    try {
      const aleoWorker = await getAleoWorker();
      // Clean API: just pass recipient and points
      const newCard = await aleoWorker.mintCard(account.address, 100);

      setCard(newCard);
      setStatus(`Loyalty card minted! You have ${newCard.points} points (${TIER_NAMES[newCard.tier]} tier)`);
    } catch (error) {
      setStatus(`Error minting card: ${error}`);
    }
    setLoading("");
  };

  // Add points to the card - clean API!
  const handleAddPoints = async () => {
    if (!card) {
      setStatus("Please mint a card first");
      return;
    }

    setLoading(`Adding ${pointsToAdd} points (computing hash for audit trail)...`);
    try {
      const aleoWorker = await getAleoWorker();
      // Clean API: pass the card object directly
      const updatedCard = await aleoWorker.addPoints(card, pointsToAdd);

      setCard(updatedCard);
      setStatus(
        `Added ${pointsToAdd} points! New balance: ${updatedCard.points} (${TIER_NAMES[updatedCard.tier]} tier)`
      );
    } catch (error) {
      setStatus(`Error adding points: ${error}`);
    }
    setLoading("");
  };

  // Redeem points for a voucher - clean API!
  const handleRedeem = async () => {
    if (!card) {
      setStatus("Please mint a card first");
      return;
    }

    if (card.points < pointsCost) {
      setStatus(`Not enough points! You have ${card.points}, need ${pointsCost}`);
      return;
    }

    setLoading("Redeeming points for voucher (multi-program execution)...");
    try {
      const aleoWorker = await getAleoWorker();
      // Clean API: pass card, reward type, and cost
      const result = await aleoWorker.redeemForVoucher(
        card,
        selectedRewardType,
        pointsCost
      );

      setCard(result.card);
      setVouchers(prev => [...prev, result.voucher]);
      setStatus(
        `Redeemed ${pointsCost} points for a ${REWARD_TYPE_NAMES[result.voucher.rewardType]} voucher (value: ${result.voucher.value})!`
      );
    } catch (error) {
      setStatus(`Error redeeming: ${error}`);
    }
    setLoading("");
  };

  // Use (burn) a voucher - clean API!
  const handleUseVoucher = async (voucherToUse: RewardVoucher) => {
    setLoading("Using voucher (consuming record)...");
    try {
      const aleoWorker = await getAleoWorker();
      // Clean API: just pass the voucher
      await aleoWorker.useVoucher(voucherToUse);

      // Remove the used voucher from the array (use raw record string for uniqueness)
      setVouchers(prev => prev.filter(v => v.raw !== voucherToUse.raw));
      setStatus("Voucher used successfully! It has been consumed.");
    } catch (error) {
      setStatus(`Error using voucher: ${error}`);
    }
    setLoading("");
  };

  // Get tier badge color
  const getTierColor = (tier: number) => {
    switch (tier) {
      case CardTier.Gold:
        return "#FFD700";
      case CardTier.Silver:
        return "#C0C0C0";
      default:
        return "#CD7F32";
    }
  };

  if (!initialized) {
    return (
      <div className="loading">
        Initializing loyalty program...
      </div>
    );
  }

  return (
    <>
      <div>
        <a href="https://provable.com" target="_blank">
          <img src={aleoLogo} className="logo" alt="Aleo logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Loyalty Program Demo</h1>
      <p className="subtitle">
        Multi-program example with records, hashes, and mappings
      </p>

      {/* Status display */}
      {loading && <div className="loading">{loading}</div>}
      {status && <div className="status">{status}</div>}

      {/* Account Section */}
      <div className="card">
        <h2>1. Account</h2>
        {account && (
          <div className="account-info">
            <p>
              <strong>Address:</strong>{" "}
              <code>{account.address.slice(0, 20)}...</code>
            </p>
            <p className="account-mode">
              {provingMode === "delegated"
                ? "Using pre-funded demo account"
                : "Using generated account (local mode)"}
            </p>
          </div>
        )}
      </div>

      {/* Loyalty Card Section */}
      <div className="card">
        <h2>2. Loyalty Card</h2>
        {!card ? (
          <button onClick={handleMintCard} disabled={!account || !!loading}>
            Mint Loyalty Card
          </button>
        ) : (
          <div className="card-display">
            <div
              className="loyalty-card"
              style={{ borderColor: getTierColor(card.tier) }}
            >
              <div
                className="tier-badge"
                style={{ backgroundColor: getTierColor(card.tier) }}
              >
                {TIER_NAMES[card.tier]}
              </div>
              <div className="points-display">
                <span className="points-value">{card.points}</span>
                <span className="points-label">Points</span>
              </div>
              <div className="card-id">
                ID: {card.cardId.slice(0, 12)}...
              </div>
            </div>
            <div className="points-controls">
              <input
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(Number(e.target.value))}
                min="1"
                max="10000"
              />
              <button onClick={handleAddPoints} disabled={!!loading}>
                Add Points
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rewards Section */}
      <div className="card">
        <h2>3. Redeem Rewards</h2>
        {card && (
          <div className="redeem-controls">
            <div className="input-group">
              <label>Reward Type:</label>
              <select
                value={selectedRewardType}
                onChange={(e) => setSelectedRewardType(Number(e.target.value))}
              >
                <option value={RewardType.Discount}>Discount</option>
                <option value={RewardType.Freebie}>Freebie</option>
                <option value={RewardType.Upgrade}>Upgrade</option>
              </select>
            </div>
            <div className="input-group">
              <label>Points Cost:</label>
              <input
                type="number"
                value={pointsCost}
                onChange={(e) => setPointsCost(Number(e.target.value))}
                min="10"
                max={card.points}
              />
            </div>
            <button
              onClick={handleRedeem}
              disabled={!!loading || card.points < pointsCost}
            >
              Redeem for Voucher
            </button>
          </div>
        )}

        {vouchers.length > 0 && (
          <div className="voucher-display">
            <h3>Your Vouchers ({vouchers.length})</h3>
            <div className="vouchers-list">
              {vouchers.map((v) => (
                <div key={v.voucherId} className="voucher-item">
                  <div className="voucher">
                    <div className="voucher-type">
                      {REWARD_TYPE_NAMES[v.rewardType]}
                    </div>
                    <div className="voucher-value">Value: {v.value}</div>
                    <div className="voucher-id">
                      ID: {v.voucherId.slice(0, 12)}...
                    </div>
                  </div>
                  <button onClick={() => handleUseVoucher(v)} disabled={!!loading}>
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Program Info */}
      <div className="card info-card">
        <h2>About This Demo</h2>
        <p className="api-example">
          <strong>Clean API Example:</strong>
        </p>
        <pre className="code-block">
{`// Initialize once
await loyalty.initLoyaltyProgram(tokenProgram, rewardsProgram);

// Mint a card
const card = await loyalty.mintCard(address, 1000);

// Add points (typed LoyaltyCard)
const updated = await loyalty.addPoints(card, 500);

// Redeem for voucher (typed RedeemResult)
const { card, voucher } = await loyalty.redeemForVoucher(
  card,
  RewardType.Discount,
  100
);

// Use voucher
await loyalty.useVoucher(voucher);`}
        </pre>
        <ul>
          <li>
            <strong>Multi-Program:</strong> Uses loyalty_token.aleo and
            loyalty_rewards.aleo
          </li>
          <li>
            <strong>Hash Functions:</strong> BHP256 generates unique card/voucher
            IDs
          </li>
          <li>
            <strong>Typed Records:</strong> LoyaltyCard and RewardVoucher
            interfaces
          </li>
          <li>
            <strong>Enums:</strong> RewardType.Discount, CardTier.Gold, etc.
          </li>
        </ul>
      </div>

      <p className="read-the-docs">
        Click on the Aleo and React logos to learn more
      </p>
    </>
  );
}

export default App;
