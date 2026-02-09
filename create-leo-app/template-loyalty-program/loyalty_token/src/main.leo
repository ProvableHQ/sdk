// The 'loyalty_token' program.
// Demonstrates: record creation, hash functions, mapping updates, mint-use-check flow

program loyalty_token.aleo {
    // Struct for hashing card ID inputs
    struct CardIdInput {
        owner: address,
        nonce: field,
        points: u64
    }

    // Struct for hashing audit trail
    struct AuditInput {
        card_id: field,
        old_points: u64,
        new_points: u64
    }

    // LoyaltyCard record - the core record type
    record LoyaltyCard {
        owner: address,
        card_id: field,      // Hash-generated unique ID
        points: u64,
        tier: u8             // 0=bronze, 1=silver, 2=gold
    }

    // Mappings for public state
    mapping card_exists: field => bool;           // card_id => exists
    mapping total_cards: field => u64;            // 0field => count
    mapping total_points_issued: field => u64;    // 0field => total
    mapping point_audits: field => u64;           // audit_hash => points added

    // Helper function to calculate tier based on points
    inline calculate_tier(points: u64) -> u8 {
        // Gold tier: 10000+ points
        // Silver tier: 1000-9999 points
        // Bronze tier: 0-999 points
        return points >= 10000u64 ? 2u8 : (points >= 1000u64 ? 1u8 : 0u8);
    }

    // Function 1: MINT - Creates new record with hash-generated ID
    // Demonstrates: record creation, hash functions (heavy), mapping updates
    async transition mint_card(
        recipient: address,
        initial_points: u64,
        nonce: field              // Random value for uniqueness
    ) -> (LoyaltyCard, Future) {
        // Hash to generate unique card_id (HEAVY operation for parameter downloads)
        let card_id: field = BHP256::hash_to_field(
            CardIdInput { owner: recipient, nonce: nonce, points: initial_points }
        );

        // Calculate initial tier
        let tier: u8 = calculate_tier(initial_points);

        // Create the record
        let card: LoyaltyCard = LoyaltyCard {
            owner: recipient,
            card_id: card_id,
            points: initial_points,
            tier: tier
        };

        return (card, finalize_mint_card(card_id));
    }

    async function finalize_mint_card(card_id: field) {
        // Check card doesn't already exist (mint → check mapping flow)
        let exists: bool = Mapping::contains(card_exists, card_id);
        assert(!exists);

        // Register card in mapping
        Mapping::set(card_exists, card_id, true);

        // Update total cards count
        let count: u64 = Mapping::get_or_use(total_cards, 0field, 0u64);
        Mapping::set(total_cards, 0field, count + 1u64);
    }

    // Function 2: CONSUME & CREATE - Takes record, outputs new record
    // Demonstrates: record consumption, hash functions (heavy), mapping verification
    async transition add_points(
        card: LoyaltyCard,
        points_earned: u64
    ) -> (LoyaltyCard, Future) {
        // Consume old card, create new with updated points
        let new_points: u64 = card.points + points_earned;

        // Calculate tier based on points (adds logic complexity)
        let new_tier: u8 = calculate_tier(new_points);

        // Hash for audit trail (HEAVY operation)
        let audit_hash: field = BHP256::hash_to_field(
            AuditInput { card_id: card.card_id, old_points: card.points, new_points: new_points }
        );

        // Create new card with updated points
        let new_card: LoyaltyCard = LoyaltyCard {
            owner: card.owner,
            card_id: card.card_id,
            points: new_points,
            tier: new_tier
        };

        return (new_card, finalize_add_points(card.card_id, points_earned, audit_hash));
    }

    async function finalize_add_points(card_id: field, points: u64, audit_hash: field) {
        // Verify card exists in mapping (USE → CHECK flow)
        let exists: bool = Mapping::get(card_exists, card_id);
        assert(exists);

        // Update total points issued
        let total: u64 = Mapping::get_or_use(total_points_issued, 0field, 0u64);
        Mapping::set(total_points_issued, 0field, total + points);

        // Store audit hash for transparency
        Mapping::set(point_audits, audit_hash, points);
    }

    // Function 3: VIEW POINTS - Transition to check card points (useful for testing)
    transition check_points(card: LoyaltyCard) -> (LoyaltyCard, u64) {
        // Return the card and its points
        return (card, card.points);
    }

    // Function 4: TRANSFER CARD - Transfer ownership of a card
    async transition transfer_card(
        card: LoyaltyCard,
        new_owner: address
    ) -> (LoyaltyCard, Future) {
        // Create new card with new owner
        let transferred_card: LoyaltyCard = LoyaltyCard {
            owner: new_owner,
            card_id: card.card_id,
            points: card.points,
            tier: card.tier
        };

        return (transferred_card, finalize_transfer_card(card.card_id));
    }

    async function finalize_transfer_card(card_id: field) {
        // Verify card exists before allowing transfer
        let exists: bool = Mapping::get(card_exists, card_id);
        assert(exists);
    }
}
