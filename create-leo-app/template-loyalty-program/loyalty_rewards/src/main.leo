// The 'loyalty_rewards' program.
// Demonstrates: multi-program imports, cross-program record handling, voucher creation

import loyalty_token.aleo;

program loyalty_rewards.aleo {
    // Struct for hashing voucher ID inputs
    struct VoucherInput {
        card_id: field,
        reward_type: u8,
        cost: u64
    }

    // RewardVoucher record - created when redeeming points
    record RewardVoucher {
        owner: address,
        voucher_id: field,     // Hash-generated unique ID
        reward_type: u8,       // 1=discount, 2=freebie, 3=upgrade
        value: u64             // Voucher value (points_cost / 10)
    }

    // Mappings for voucher state
    mapping voucher_exists: field => bool;        // voucher_id => exists
    mapping voucher_used: field => bool;          // voucher_id => was_used
    mapping redemptions_by_type: field => u64;    // reward_type => count
    mapping rewards_catalog: u8 => u64;           // reward_type => points_cost

    // Function 1: REDEEM - Cross-program interaction
    // Consumes loyalty card points, creates voucher
    // Demonstrates: multi-program record handling, multiple record outputs
    async transition redeem_for_voucher(
        card: loyalty_token.aleo/LoyaltyCard,
        reward_type: u8,
        points_cost: u64
    ) -> (loyalty_token.aleo/LoyaltyCard, RewardVoucher, Future) {
        // Validate enough points
        assert(card.points >= points_cost);

        // Validate reward type (1, 2, or 3)
        assert(reward_type >= 1u8 && reward_type <= 3u8);

        // Hash for voucher ID (HEAVY operation)
        let voucher_id: field = BHP256::hash_to_field(
            VoucherInput { card_id: card.card_id, reward_type: reward_type, cost: points_cost }
        );

        // Deduct points from card (consume old, create new)
        let updated_card: loyalty_token.aleo/LoyaltyCard = loyalty_token.aleo/LoyaltyCard {
            owner: card.owner,
            card_id: card.card_id,
            points: card.points - points_cost,
            tier: card.tier
        };

        // Create voucher record
        // Value is points_cost / 10 (10 points = 1 value unit)
        let voucher: RewardVoucher = RewardVoucher {
            owner: card.owner,
            voucher_id: voucher_id,
            reward_type: reward_type,
            value: points_cost / 10u64
        };

        return (updated_card, voucher, finalize_redeem_for_voucher(voucher_id, reward_type));
    }

    async function finalize_redeem_for_voucher(voucher_id: field, reward_type: u8) {
        // Check voucher doesn't already exist
        let exists: bool = Mapping::contains(voucher_exists, voucher_id);
        assert(!exists);

        // Register voucher
        Mapping::set(voucher_exists, voucher_id, true);

        // Update redemption stats per reward type
        let type_key: field = reward_type as field;
        let count: u64 = Mapping::get_or_use(redemptions_by_type, type_key, 0u64);
        Mapping::set(redemptions_by_type, type_key, count + 1u64);
    }

    // Function 2: USE VOUCHER - Consume voucher record
    // Demonstrates: record consumption (burning)
    async transition use_voucher(voucher: RewardVoucher) -> Future {
        // Voucher is consumed (burned) when used
        // The voucher record is spent and cannot be used again
        return finalize_use_voucher(voucher.voucher_id);
    }

    async function finalize_use_voucher(voucher_id: field) {
        // Verify voucher exists
        let exists: bool = Mapping::get(voucher_exists, voucher_id);
        assert(exists);

        // Check voucher hasn't been used before
        let was_used: bool = Mapping::get_or_use(voucher_used, voucher_id, false);
        assert(!was_used);

        // Mark voucher as used
        Mapping::set(voucher_used, voucher_id, true);
    }

    // Function 3: CHECK VOUCHER - View voucher details
    transition check_voucher(voucher: RewardVoucher) -> (RewardVoucher, u8, u64) {
        // Return the voucher, its type, and value
        return (voucher, voucher.reward_type, voucher.value);
    }

    // Function 4: TRANSFER VOUCHER - Transfer voucher to another user
    async transition transfer_voucher(
        voucher: RewardVoucher,
        new_owner: address
    ) -> (RewardVoucher, Future) {
        // Create new voucher with new owner
        let transferred_voucher: RewardVoucher = RewardVoucher {
            owner: new_owner,
            voucher_id: voucher.voucher_id,
            reward_type: voucher.reward_type,
            value: voucher.value
        };

        return (transferred_voucher, finalize_transfer_voucher(voucher.voucher_id));
    }

    async function finalize_transfer_voucher(voucher_id: field) {
        // Verify voucher exists and hasn't been used
        let exists: bool = Mapping::get(voucher_exists, voucher_id);
        assert(exists);

        let was_used: bool = Mapping::get_or_use(voucher_used, voucher_id, false);
        assert(!was_used);
    }
}
