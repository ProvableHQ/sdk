// The 'loyalty_token' program.

program loyalty_token.aleo {
    // Admin address for upgrade authorization
    const ADMIN: address = aleo1ntkc8z9ea8gjp7pkudlh5xqj0xw8k86lc64yh7yd06708ye9gv9s6j8l45;

    // Hash input for deterministic card ID generation
    struct CardIdInput {
        holder: address,
        nonce: field,
        points: u64
    }

    // Private loyalty card issued to a holder
    record LoyaltyCard {
        owner: address,
        card_id: field,
        points: u64,
        tier: u8  // 0=bronze, 1=silver, 2=gold
    }

    // Tracks whether a card ID has been minted
    mapping card_exists: field => bool;
    // Global card count (keyed by 0field)
    mapping total_cards: field => u64;
    // Global points issued (keyed by 0field)
    mapping total_points_issued: field => u64;
    // Pre-approved checksums for program upgrades
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

    // Calculate tier: Gold (10000+), Silver (1000-9999), Bronze (0-999)
    inline calculate_tier(points: u64) -> u8 {
        return points >= 10000u64 ? 2u8 : (points >= 1000u64 ? 1u8 : 0u8);
    }

    // Issue a new loyalty card with an initial point balance
    async transition mint_card(
        recipient: address,
        initial_points: u64,
        nonce: field
    ) -> (LoyaltyCard, Future) {
        let card_id: field = BHP256::hash_to_field(
            CardIdInput { holder: recipient, nonce: nonce, points: initial_points }
        );

        let tier: u8 = calculate_tier(initial_points);

        let card: LoyaltyCard = LoyaltyCard {
            owner: recipient,
            card_id: card_id,
            points: initial_points,
            tier: tier
        };

        return (card, finalize_mint_card(card_id));
    }

    async function finalize_mint_card(card_id: field) {
        let exists: bool = Mapping::contains(card_exists, card_id);
        assert(!exists);

        Mapping::set(card_exists, card_id, true);

        let count: u64 = Mapping::get_or_use(total_cards, 0field, 0u64);
        Mapping::set(total_cards, 0field, count + 1u64);
    }

    // Add earned points to an existing card and recalculate tier
    async transition add_points(
        card: LoyaltyCard,
        points_earned: u64
    ) -> (LoyaltyCard, Future) {
        let new_points: u64 = card.points + points_earned;
        let new_tier: u8 = calculate_tier(new_points);

        let new_card: LoyaltyCard = LoyaltyCard {
            owner: card.owner,
            card_id: card.card_id,
            points: new_points,
            tier: new_tier
        };

        return (new_card, finalize_add_points(card.card_id, points_earned));
    }

    async function finalize_add_points(card_id: field, points: u64) {
        let exists: bool = Mapping::get(card_exists, card_id);
        assert(exists);

        let total: u64 = Mapping::get_or_use(total_points_issued, 0field, 0u64);
        Mapping::set(total_points_issued, 0field, total + points);
    }

    // Return a card's current point balance without consuming it
    transition check_points(card: LoyaltyCard) -> (LoyaltyCard, u64) {
        return (card, card.points);
    }

    // Transfer card ownership to a new address
    async transition transfer_card(
        card: LoyaltyCard,
        new_owner: address
    ) -> (LoyaltyCard, Future) {
        let transferred_card: LoyaltyCard = LoyaltyCard {
            owner: new_owner,
            card_id: card.card_id,
            points: card.points,
            tier: card.tier
        };

        return (transferred_card, finalize_transfer_card(card.card_id));
    }

    async function finalize_transfer_card(card_id: field) {
        let exists: bool = Mapping::get(card_exists, card_id);
        assert(exists);
    }

    // Split a card into two, distributing points between them
    async transition split_card(
        card: LoyaltyCard,
        points_to_keep: u64
    ) -> (LoyaltyCard, LoyaltyCard, Future) {
        assert(points_to_keep < card.points);
        let points_to_split: u64 = card.points - points_to_keep;

        let kept_card: LoyaltyCard = LoyaltyCard {
            owner: card.owner,
            card_id: card.card_id,
            points: points_to_keep,
            tier: calculate_tier(points_to_keep)
        };

        // Derive nonce from the record's hidden _nonce for protocol-level randomness
        let split_card_id: field = BHP256::hash_to_field(
            CardIdInput { holder: card.owner, nonce: BHP256::hash_to_field(card), points: points_to_split }
        );
        let split_card: LoyaltyCard = LoyaltyCard {
            owner: card.owner,
            card_id: split_card_id,
            points: points_to_split,
            tier: calculate_tier(points_to_split)
        };

        return (kept_card, split_card, finalize_split_card(card.card_id, split_card_id));
    }

    async function finalize_split_card(original_card_id: field, new_card_id: field) {
        let exists: bool = Mapping::get(card_exists, original_card_id);
        assert(exists);

        Mapping::set(card_exists, new_card_id, true);

        let count: u64 = Mapping::get_or_use(total_cards, 0field, 0u64);
        Mapping::set(total_cards, 0field, count + 1u64);
    }

    // Deduct points from a card (called by loyalty_rewards during redemption)
    transition spend_points(
        card: LoyaltyCard,
        points_to_spend: u64
    ) -> LoyaltyCard {
        assert(card.points >= points_to_spend);

        let new_points: u64 = card.points - points_to_spend;

        return LoyaltyCard {
            owner: card.owner,
            card_id: card.card_id,
            points: new_points,
            tier: calculate_tier(new_points)
        };
    }
}
