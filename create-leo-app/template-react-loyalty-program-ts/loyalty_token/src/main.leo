// The 'loyalty_token' program.

program loyalty_token.aleo {
    struct CardIdInput {
        holder: address,
        nonce: field,
        points: u64
    }

    record LoyaltyCard {
        owner: address,
        card_id: field,
        points: u64,
        tier: u8  // 0=bronze, 1=silver, 2=gold
    }

    mapping card_exists: field => bool;
    mapping total_cards: field => u64;
    mapping total_points_issued: field => u64;

    // Calculate tier: Gold (10000+), Silver (1000-9999), Bronze (0-999)
    inline calculate_tier(points: u64) -> u8 {
        return points >= 10000u64 ? 2u8 : (points >= 1000u64 ? 1u8 : 0u8);
    }

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

    transition check_points(card: LoyaltyCard) -> (LoyaltyCard, u64) {
        return (card, card.points);
    }

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

    async transition split_card(
        card: LoyaltyCard,
        points_to_keep: u64,
        new_nonce: field
    ) -> (LoyaltyCard, LoyaltyCard, Future) {
        assert(points_to_keep < card.points);
        let points_to_split: u64 = card.points - points_to_keep;

        let kept_card: LoyaltyCard = LoyaltyCard {
            owner: card.owner,
            card_id: card.card_id,
            points: points_to_keep,
            tier: calculate_tier(points_to_keep)
        };

        let split_card_id: field = BHP256::hash_to_field(
            CardIdInput { holder: card.owner, nonce: new_nonce, points: points_to_split }
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
