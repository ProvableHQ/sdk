# Aleo Loyalty Program Demo

A multi-program example demonstrating advanced SDK features:

- **Record minting and consumption** - Create and update loyalty cards
- **Hash functions (BHP256)** - Generate unique IDs for cards and vouchers
- **Mapping updates and reads** - Track public state on-chain
- **Multi-program architecture** - loyalty_token.aleo + loyalty_rewards.aleo
- **Mint-Use-Check flow** - Proper state validation patterns

## Programs

### loyalty_token.aleo

Core loyalty card functionality:

- `mint_card` - Create a new loyalty card with hash-generated unique ID
- `add_points` - Add points to a card (consumes and creates new record)
- `check_points` - View card points
- `transfer_card` - Transfer card ownership

Records: `LoyaltyCard { owner, card_id, points, tier }`

Mappings: `card_exists`, `total_cards`, `total_points_issued`, `point_audits`

### loyalty_rewards.aleo

Voucher redemption system (imports loyalty_token):

- `redeem_for_voucher` - Exchange points for a voucher (multi-record output)
- `use_voucher` - Consume a voucher
- `check_voucher` - View voucher details
- `transfer_voucher` - Transfer voucher ownership

Records: `RewardVoucher { owner, voucher_id, reward_type, value }`

Mappings: `voucher_exists`, `voucher_used`, `redemptions_by_type`,
`rewards_catalog`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Using Vite (recommended for development)
npm run dev

# Using Webpack
npm run dev-webpack
```

### Build

```bash
# Production build with Webpack
npm run build

# Production build with Vite
npm run build:vite
```

## SDK Features Demonstrated

1. **Record Operations**

    - Creating records with `cast`
    - Consuming records as inputs
    - Multiple record outputs

2. **Hash Functions**

    - `BHP256::hash_to_field` for unique ID generation
    - Adds proving complexity for parameter download testing

3. **Mapping Operations**

    - `Mapping::set` - Write to mappings
    - `Mapping::get` - Read from mappings
    - `Mapping::get_or_use` - Read with default value
    - `Mapping::contains` - Check key existence

4. **Multi-Program**
    - Import statements
    - Cross-program record types
    - Calling functions from imported programs

## Tier System

Points determine card tier:

- **Bronze**: 0-999 points
- **Silver**: 1,000-9,999 points
- **Gold**: 10,000+ points

## Reward Types

- **1 - Discount**: Percentage off purchases
- **2 - Freebie**: Free item
- **3 - Upgrade**: Service upgrade

Voucher value = points_cost / 10

## Learn More

- [Aleo Developer Documentation](https://developer.aleo.org)
- [Leo Language Guide](https://docs.leo-lang.org/leo)
- [Provable SDK Documentation](https://docs.provable.com)
