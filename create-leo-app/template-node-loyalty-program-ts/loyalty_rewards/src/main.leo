// The 'loyalty_rewards' program.

import loyalty_token.aleo;

program loyalty_rewards.aleo {
    // Admin address for upgrade authorization
    const ADMIN: address = aleo1ntkc8z9ea8gjp7pkudlh5xqj0xw8k86lc64yh7yd06708ye9gv9s6j8l45;

    struct VoucherInput {
        card_id: field,
        reward_type: u8,
        cost: u64
    }

    record RewardVoucher {
        owner: address,
        voucher_id: field,
        reward_type: u8,       // 1=discount, 2=freebie, 3=upgrade
        amount: u64
    }

    mapping voucher_exists: field => bool;
    mapping voucher_used: field => bool;
    mapping redemptions_by_type: field => u64;
    mapping approved_upgrades: field => bool;

    // Constructor runs on deployment and upgrades
    // First deployment (edition 0) has no restrictions
    // Upgrades require admin to pre-approve the new checksum
    @custom
    async constructor() {
        if self.edition > 0u16 {
            let checksum_hash: field = BHP256::hash_to_field(self.checksum);
            let approved: bool = approved_upgrades.get(checksum_hash);
            assert(approved);
        }
    }

    // Admin calls this before deploying a new version
    async transition approve_upgrade(checksum: [u8; 32]) -> Future {
        assert_eq(self.caller, ADMIN);
        return finalize_approve_upgrade(BHP256::hash_to_field(checksum));
    }

    async function finalize_approve_upgrade(checksum_hash: field) {
        approved_upgrades.set(checksum_hash, true);
    }

    async transition redeem_points_for_voucher(
        card: loyalty_token.aleo/LoyaltyCard,
        reward_type: u8,
        points_to_spend: u64
    ) -> (loyalty_token.aleo/LoyaltyCard, RewardVoucher, Future) {
        assert(reward_type >= 1u8 && reward_type <= 3u8);
        assert(points_to_spend >= 100u64);
        assert(card.points >= points_to_spend);

        let updated_card: loyalty_token.aleo/LoyaltyCard = loyalty_token.aleo/spend_points(card, points_to_spend);

        let voucher_id: field = BHP256::hash_to_field(
            VoucherInput { card_id: card.card_id, reward_type: reward_type, cost: points_to_spend }
        );

        let voucher: RewardVoucher = RewardVoucher {
            owner: card.owner,
            voucher_id: voucher_id,
            reward_type: reward_type,
            amount: points_to_spend / 10u64
        };

        return (updated_card, voucher, finalize_redeem_card(voucher_id, reward_type));
    }

    async function finalize_redeem_card(voucher_id: field, reward_type: u8) {
        let exists: bool = Mapping::contains(voucher_exists, voucher_id);
        assert(!exists);

        Mapping::set(voucher_exists, voucher_id, true);

        let type_key: field = reward_type as field;
        let count: u64 = Mapping::get_or_use(redemptions_by_type, type_key, 0u64);
        Mapping::set(redemptions_by_type, type_key, count + 1u64);
    }

    async transition use_voucher(voucher: RewardVoucher) -> Future {
        return finalize_use_voucher(voucher.voucher_id);
    }

    async function finalize_use_voucher(voucher_id: field) {
        let exists: bool = Mapping::get(voucher_exists, voucher_id);
        assert(exists);

        let was_used: bool = Mapping::get_or_use(voucher_used, voucher_id, false);
        assert(!was_used);

        Mapping::set(voucher_used, voucher_id, true);
    }

    transition check_voucher(voucher: RewardVoucher) -> (RewardVoucher, u8, u64) {
        return (voucher, voucher.reward_type, voucher.amount);
    }

    async transition transfer_voucher(
        voucher: RewardVoucher,
        new_owner: address
    ) -> (RewardVoucher, Future) {
        let transferred_voucher: RewardVoucher = RewardVoucher {
            owner: new_owner,
            voucher_id: voucher.voucher_id,
            reward_type: voucher.reward_type,
            amount: voucher.amount
        };

        return (transferred_voucher, finalize_transfer_voucher(voucher.voucher_id));
    }

    async function finalize_transfer_voucher(voucher_id: field) {
        let exists: bool = Mapping::get(voucher_exists, voucher_id);
        assert(exists);

        let was_used: bool = Mapping::get_or_use(voucher_used, voucher_id, false);
        assert(!was_used);
    }
}
