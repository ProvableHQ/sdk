# Loyalty Program - Node.js Example

A Node.js example demonstrating the Aleo SDK with a multi-program loyalty points
system.

## Features

This example showcases:

- **Multi-Program Architecture**: Two Leo programs that work together
    - `loyalty_token.aleo`: Manages loyalty cards and points
    - `loyalty_rewards.aleo`: Handles voucher redemption (imports loyalty_token)
- **Record Operations**: Minting, consuming, and transferring records
- **Hash Functions**: BHP256 for generating unique card/voucher IDs
- **Program Imports**: Cross-program execution with imports
- **Tier System**: Bronze → Silver → Gold based on points
- **Proving Modes**: Local execution or delegated proving via DPS
- **Record Scanning**: Find on-chain records via RecordScanner service

## Quick Start

```bash
# Install dependencies
npm install

# Run the full demo flow (local proving)
npm start

# Or run specific modes
npm run local              # Local proving (default)
npm run delegated          # Delegated proving via DPS
npm run scanner            # Scan for on-chain records

# Or run specific functions
npm run start:mint         # Mint a new loyalty card
npm run start:add          # Add points to a card
npm run start:redeem       # Redeem points for a voucher
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Consumer ID (used for both DPS and RSS)
ALEO_CONSUMER_ID=your-consumer-id

# For delegated mode
ALEO_PROVING_MODE=delegated
ALEO_DPS_URL=https://api.provable.com/prove/testnet
ALEO_DPS_API_KEY=your-api-key

# For record scanning
ALEO_RSS_URL=https://api.provable.com/scanner
```

## API Overview

```typescript
import { LoyaltyProgram, RewardType, CardTier } from "./index";

// Create instance with an account
const loyalty = new LoyaltyProgram(account);
loyalty.setPrograms(tokenProgram, rewardsProgram);

// Mint a new loyalty card
const card = await loyalty.mintCard(address, 1000);
// => LoyaltyCard { owner, cardId, points: 1000, tier: Bronze }

// Add points (consumes old card, creates new)
const updatedCard = await loyalty.addPoints(card, 500);
// => LoyaltyCard { points: 1500, tier: Silver }

// Redeem points for a voucher (multi-program execution)
const { card: newCard, voucher } = await loyalty.redeemForVoucher(
    updatedCard,
    RewardType.Discount,
    500,
);
// => { card: LoyaltyCard, voucher: RewardVoucher }

// Use (burn) the voucher
await loyalty.useVoucher(voucher);

// Find on-chain records (requires RecordScanner)
const myCards = await loyalty.findMyCards();
const myVouchers = await loyalty.findMyVouchers();
```

## Program Architecture

```
loyalty_token.aleo (Base Program)
├── LoyaltyCard record
├── mint_card() - Create new cards with hash-generated IDs
├── add_points() - Add points, recalculate tier
├── check_points() - View without consuming
└── transfer_card() - Transfer ownership

loyalty_rewards.aleo (Imports loyalty_token)
├── RewardVoucher record
├── redeem_for_voucher() - Exchange points for voucher
├── use_voucher() - Consume/burn voucher
├── check_voucher() - View without consuming
└── transfer_voucher() - Transfer ownership
```

## Tier Thresholds

| Tier   | Points Required |
| ------ | --------------- |
| Bronze | 0 - 999         |
| Silver | 1,000 - 9,999   |
| Gold   | 10,000+         |

## Reward Types

| Type     | Value | Description     |
| -------- | ----- | --------------- |
| Discount | 1     | Percentage off  |
| Freebie  | 2     | Free item       |
| Upgrade  | 3     | Service upgrade |

## Learn More

- [Aleo SDK Documentation](https://developer.aleo.org/sdk)
- [Leo Language Guide](https://developer.aleo.org/leo)
- [Aleo Developer Portal](https://developer.aleo.org)
