import credits.aleo;

// A an auction contract.
program private_auction.aleo {

    ////////////////////////////////////////
    ///// ----- DATA DEFINITIONS ----- /////
    ////////////////////////////////////////

    // Description of an item's data.
    // - `starting_bid` : The minimum bid for the auction.
    // - `item`        : The item being auctioned.
    struct auction {
        starting_bid: u64, // The starting bid for the auction.
        name: u64, // A unique name for the auction.
        item: item, // The item being auctioned.
    }

    // Description of an item.
    struct item {
        id: field, // Unique id for the item.
        offchain_data: [field; 4], // Link to offchain data for the item.
    }

    // Description of the auction_type.
    struct auction_settings {
        auction_type: field, // 0 = private, 1 = public
        bid_types_accepted: field, // 0 = private, 1 = public, 2 = mixed
    }

    // Description of a bid.
    struct bid {
        amount: u64,
        auction_id: field,
        bid_public_key: group,
    }

    ///////////////////////////////////
    ///// ----- PUBLIC DATA ----- /////
    ///////////////////////////////////

    ///// ----- AUCTION MAPPINGS ----- /////

    // Searchable mapping of auction ids to auction data.
    mapping auctions: u64 => field;

    // Bid count for an auction.
    mapping bid_count: field => u64;

    // Create a set of auction public keys.
    mapping auction_public_keys: field => group;

    // Auction mapping of of whether an auction has been concluded, with the winning bids.
    mapping winning_bid: field => field;

    // Auction mapping for public auctions.
    mapping public_auctions: field => auction;
    
    // Auction mapping identifying the owner of an auction for public auctions.
    mapping public_auction_owners: field => address;

    // Determine what kind of bids are accepted.
    mapping public_auction_settings: field => auction_settings;

    // Highest bid for public or mixed auction.
    mapping highest_bid: field => u64;

    // Record of auctions in which the bidder has redeemed their bid.
    mapping redemptions: field => field;

    ///// ----- BID MAPPINGS ----- /////

    // Public bid id to bid_data.
    mapping public_bids: field => bid;

    // Map of public bid owners.
    mapping public_bid_owners: field => address;

    ////////////////////////////////////
    ///// ----- PRIVATE DATA ----- /////
    ////////////////////////////////////

    // Auction ticket representing a private auction. This ticket ensures the auctioneer honestly closes the bid.
    record AuctionTicket {
        owner: address, // The auctioneer's address.
        auction: auction, // The auction data.
        auction_id: field, // The auction id.
        settings: auction_settings, // The auction settings.
        is_open: bool, // Whether the auction is open or closed.
    }

    // Record authorizing redemption of an item.
    record RedemptionTicket {
        auction_id: field, // The auction id.
        payout_address: address, // The payout address desired by the auctioneer.
        bid: bid, // The bid data.
    }

    // Create an invite representing an auction.
    record AuctionInvite {
        owner: address, // The address of the account invited to bid.
        auction: auction, // The auction data.
        auctioneer: address, // The address of the auctioneer.
        auction_id: field, // The auction id.
    }

    // A bid receipt to ensure the bidder knows their own bids so it can discover them later.
    record BidReceipt {
        owner: address, // The address of the account that made the bid.
        auction_id: field, // The auction id.
        bid: bid, // The bid data.
        bid_id: field, // The bid id.
    }

    // A bid in an auction.
    // - `owner`     : The address of the auctioneer.
    // - `bid`    : The bid data.
    // - `amount`    : The amount of the bid.
    record PrivateBid {
        owner: address,
        bid: bid,
        bid_id: u64,
    }

    ////////////////////////////////////////
    ///// ----- HELPER FUNCTIONS ----- /////
    ////////////////////////////////////////

    // Create a signed auction of an item.
    //
    // Ways to ensure one item description is unique.
    // 1. Ensure that the first person to create an auction with the same item description is the owner.
    // Downsides: Anyone who discovers the could get it first.
    // Upsides: No duplication other than first owner.
    //
    // 2. Put seller address
    inline create_auction(
        name: field, // Name of the auction.
        bid_types_accepted: field, // The bid privacy levels accepted (0 = private, 1 = public, 2 = mix).
        starting_bid: u64, // The starting bid for the auction.
        offchain_data: [field; 4], // Link to offchain data for the item.
        seller: address, // The address of the auctioneer.
        is_private: field, // Whether the auction is private or public.
        nonce: scalar, // A nonce derived from externally generated randomness.
    ) -> (item, field, auction_settings) {
        // Assert that the bid types accepted are less than 3 (0 = private, 1 = public, 2 = mix).
        let bid_types_valid: bool = bid_types_accepted < 3field;
        assert(bid_types_valid);

        // Create the public key for the auction.
        let auction_public_key: group = nonce*group::GEN;

        // Create the auction commit key.
        let auction_commit_key: scalar = nonce*(self.signer as group); // Cannot reconstruct in band.

        // Create the auction settings.
        let settings: auction_settings = auction_settings {
            is_private,
            bid_types_accepted,
        };

        // Create auction.
        let new_auction: auction = auction {
            starting_bid,
            name,
            offchain_data,
        };

        // Create an id.
        let auction_id: field = BHP256::commit(new_auction, auction_commit_key);

        // Return receipt.
        return (new_auction, auction_id, auction_settings, group, field);
    }

    // Create a signed bid to auction.
    inline create_bid(
        amount: u64, // The amount of the bid.
        auction_id: field, // The auction id the bid corresponds to.
        nonce: scalar // Externally generated nonce to generate a bid public key that a bidder can prove ownership of later.
    ) -> (bid, bid_id, group) {
        // Create the bid public key.
        let bid_public_key: group = nonce*group::GEN;

        // Create the bid committer key.
        let bid_committer_key: scalar = nonce*(self.signer as group);

        // Create the bid data.
        let bid: bid = bid {
            amount,
            auction_id,
            bid_public_key,
        };

        // Create the bid id.
        let bid_id: field = BHP256::commit(bid, bid_committer_key);
        return (bid, bid_id);
    }

    ///////////////////////////////////
    ///// ----- TRANSITIONS ----- /////
    ///////////////////////////////////

    // Create a private auction.
    async transition create_private_auction(
        bid_types_accepted: field, // The privacy levels of the bids (0 = private, 1 = public, 2 = mix).
        item_id: field, // The id of the item being auctioned.
        item_name: field, // The name of the item being auctioned.
        item_offchain_data: [field; 4], // Link to offchain data for the item.
        starting_bid: u64, // The starting bid for the auction.
        nonce: scalar, // A nonce derived from externally generated randomness.
    ) -> (AuctionTicket, Future) {
        // Create create an auction with an id derived from outside randomness.
        (auction_item: auction, let auction_id: field, settings: auction_settings, apk: group) = create_auction(name, starting_bid, offchain_data, self.signer, nonce);

        // Create an auction token for the auctioneer to use.
        let ticket = AuctionTicket {
            owner: self.signer,
            auction: auction_item,
            auction_id,
            settings,
            is_open: true,
        };

        // Create a future that finalizes the auction.
        let create_auction_private_future: Future = finalize_create_private_auction(auction_item, auction_id, apk);

        // Return the auction ticket and future.
        (ticket, create_auction_private_future)
    }
    async function finalize_create_private_auction(auction_item: auction, auction_id: field, apk: group) {
        // Set the auction public key to indicate it's start.
        auction_public_keys.set(auction_id, apk);
    }

    // Create a new auction publicly.
    async transition create_public_auction(
        bid_types_accepted: field, // The privacy levels of the bids (0 = private, 1 = public, 2 = mix).
        item_id: field, // The id of the item being auctioned.
        item_name: field, // The name of the item being auctioned.
        item_offchain_data: [field; 4], // Link to offchain data for the item.
        starting_bid: u64, // The starting bid for the auction.
        nonce: scalar, // A nonce derived from externally generated randomness.
    ) -> (AuctionTicket, Future) {
        // Create a signed auction.
        let (auction_item: auction, auction_id: field, settings: auction_settings, apk: group) = create_auction(name, starting_bid, offchain_data, self.signer, 1field);

        // Create an auction token for the auctioneer to use.
        let token = AuctionTicket {
            owner: self.signer,
            auction: auction_item,
            auction_id,
            settings,
            is_open: true,
        };

        // Create a future that finalizes the auction.
        let create_auction_public_future: Future = finalize_create_public_auction(auction_item, auction_id, settings);
        let receipt = AuctionTicket {
            owner: self.signer,
            auction,
            auction_id,
        };
        (receipt, create_auction_public_future)
    }
    // Finalize the creation of the auction.
    async function finalize_create_public_auction(auction_item: item, auction_id: field, settings: auction_settings) {
        // Set the auction owner.
        auction_owners.set(auction_id, self.signer);
        // Set the open auction data.
        public_auctions.set(auction_id, auction);
        // Set the auction settings.
        public_auction_settings.set(auction_id, settings);
        // Set the auction public key.
        auction_public_keys.set(auction_id, auction_public_key);
    }

    // Send a private invite to an auction. This function takes an auction receipt to ensure a the auctioneer is sending
    // an honest invite.
    transition invite_to_auction(receipt: AuctionTicket, invitee: address) -> (AuctionInvite, AuctionTicket) {
        // Ensure the bid data commitment matches the claimed data and that the auction is open.
        let auction_id = Poseidon2::hash(receipt.auction);
        assert_eq(receipt.auction_id, auction_id);

        // Ensure the auction is open.
        assert(receipt.is_open);

        // Ensure this function returns a receipt that can be used to invite another.
        let auction_token: AuctionTicket = {
            owner: receipt.owner,
            auction: receipt.auction,
            auction_id: receipt.auction_id,
            is_open: true,
        }

        // Create an auction invite.
        let auction_invite: AuctionInvite = {
            owner: invitee,
            auction: receipt.auction,
            auction_id,
        }
        (auction_invite, auction_token)
    }

    // Select winner.
    async transition select_winner_private(bid: PrivateBid, auction_token: AuctionTicket, redemption_address: address) -> (AuctionTicket, RedemptionTicket, Future) {
        // Ensure the token owner is the caller.
        assert_eq(auction_token.owner, self.signer);
        assert(auction_token.is_open);


        // Ensure the bid settings aren't restricted to public bids.
        assert_neq(auction_token.settings.bid_types_accepted, 1field);

        // Ensure the token and bid are for the same auction.
        let claimed_auction_id = Poseidon2::hash(receipt.auction);
        assert_eq(auction_token.auction_id, claimed_auction_id);
        assert_eq(bid.auction.auction_id, claimed_auction_id);

        // Ensure the bid id is valid.
        let claimed_bid_id = Poseidon2::hash(bid);
        assert_eq(bid.bid_id, claimed_bid_id);

        // Ensure the bid is valid.
        let invalidated_token: AuctionTicket = {
            owner: auction_token.owner,
            auction: auction_token.auction,
            auction_id: auction_token.auction_id,
            settings: auction_token.settings,
            is_open: false,
        };

        // Create a redemption ticket.
        let redemption_ticket: RedemptionTicket = {
            auction_id: auction_token.auction_id,
            auctioneer: redemption_address,
            bid_id: bid.bid_id,
        };

        // Finalize the selection of the winner.
        let finalize_auction_future: Future = finalize_select_winner_private(claimed_auction_id, bid.bid_id, bid.amount);
        (invalidated_token, finalize_auction_future)
    }
    async function finalize_select_winner_private(auction_id: field, bid_id: field, amount: u64) {
        // Get the bid to be selected to win.
        let bid = public_bids.get(bid_id);

        // Get the highest_bid for the auction and assert it's equal to the accepted bid.
        let highest_bid_amount = highest_bids.get(auction_id);

        // Ensure the bid is higher than the highest bid.
        assert_eq(amount, highest_bid_amount);

        // Set the bid as the winner. Thus closing the auction.
        winning_bids.set(auction_id, bid.bid_id);
    }

    // Select winner.
    async transition select_winner_public(winning_bid: bid, auction_token: AuctionTicket) -> (AuctionTicket, RedemptionTicket, Future) {
        // Ensure the token owner is the caller.
        assert_eq(auction_token.owner, self.signer);
        assert_eq(auction_token.is_open);

        // Ensure the bid settings aren't restricted to private bids.
        assert_neq(auction_token.settings.bid_types_accepted, 0field);

        let redemption_ticket: RedemptionTicket = {
            auction_id: auction_token.auction_id,
            auctioneer: self.signer,
            bid_id: bid.bid_id,
        };

        // Ensure the token and bid are for the same auction.
        let claimed_auction_id = Poseidon2::hash(receipt.auction);
        assert_eq(auction_token.auction_id, claimed_auction_id);
        assert_eq(bid.auction.auction_id, claimed_auction_id);

        // Ensure the bid id is valid.
        let invalidated_token: AuctionTicket = {
            owner: auction_token.owner,
            auction: auction_token.auction,
            auction_id: auction_token.auction_id,
            is_open: false,
        }


        // Finalize the selection of the winner.
        finalize_select_winner_public(claimed_auction_id, bid.bid_id);
    }
    async function finalize_select_winner_public(auction_id: field, bid_id: field) {
        // Get the bid to be selected to win.
        let bid = public_bids.get(bid_id);

        // Get the highest_bid for the auction and assert it's equal to the accepted bid.
        let highest_bid_amount = highest_bids.get(auction_id);

        // Ensure the bid is higher than the highest bid.
        assert_eq(bid.amount, highest_bid_amount);

        // Set the bid as the winner. Thus closing the auction.
        winning_bids.set(auction_id, bid.bid_id);
    }
    
    ///// ----- BIDDER TRANSITIONS ----- /////

    // Create a public bid.
    async transition create_public_bid(amount: u64, auction_id: field) -> (BidReceipt, Future) {
        // Create all bids.
        let (bid: Bid, bid_id: field) = create_bid(amount, auction_id);

        // Create a bid receipt.
        let receipt = BidReceipt {
            owner: self.signer,
            auction_id,
            bid,
            bid_id,
        };

        let finalize_bid_future: Future = finalize_create_public_bid(bid, bid_id);
        (receipt, finalize_bid_future)
    }
    // Store public bid.
    async function finalize_create_public_bid(bid: Bid, bid_id: field) {
        // Check if the auction is open.
        let exists: bool = bid_count.contains(bid.auction_id);
        let is_open: bool = winning_bids.contains(bid.auction_id);
        let highest_bid_amount: u64 = highest_bid.get(bid.auction_id);

        // Set the bid.
        public_bids.set(bid_id, bid);

        // Increment the bid count.
        bid_count.set(bid.auction_id, bid_count.get(bid.auction_id) + 1);

        // If the bid is higher than the highest bid, set the bid as the highest bid.
        if bid.amount > highest_bid_amount {
            highest_bid.set(bid.auction_id, bid.amount);
        }
    }
    
        // Create a private bid.
        async transition create_private_bid(amount: u64, auction_id: field, invite: AuctionInvite, nonce: scalar) -> (AuctionInvite, BidReceipt, PrivateBid, Future) {
            // Create all bids.
            let (bid: Bid, bid_id: field, bid_public_key: group) = create_bid(amount, auction_id, nonce);
    
            // Create a bid receipt.
            let private_bid = PrivateBid {
                owner: invite.auctioneer,
                bid,
                bid_id,
            };
    
            // Create a bid receipt.
            let receipt = BidReceipt {
                owner: self.signer,
                auction_id,
                bid,
                bid_id,
            };
    
            // Create a renewed auction invite.
            let renewed_invite: AuctionInvite = {
                owner: invite.owner,
                auction: invite.auction,
                auctioneer: invite.auctioneer,
                auction_id: invite.auction_id,
            };
    
            let finalize_bid_future: Future = finalize_create_private_bid(bid, bid_id);
            (receipt, finalize_bid_future)
        }
        // Store private bid.
        async function finalize_create_private_bid(bid: Bid) {
            // Increment the bid count.
            bid_count.set(bid.auction_id, bid_count.get(bid.auction_id) + 1);
            
            // Set the bid amount.
            highest_bid.set(bid.auction_id, bid.amount);
        }

    // Redeem a winning bid publicly.
    async transition redeem_bid_public(
        bid_id: field,
        bid: Bid,
        commit_key: group,
        redemption_ticket: RedemptionTicket,
    ) -> (BidReceipt, Future) {
        // Prove the caller is owner of the bid.
        let expected_bid_id: field = BHP256::commit(bid, commit_key);
        assert_eq(expected_bid_id, bid_id);

        // Transfer the the item to the auctioneer.
        credits.aleo/transfer_public(redemption_ticket.payout_address, redemption_ticket.amount);

        // Attempt to redeem the bid.
        finalize_redeem_bid_public(bid.auction_id, bid.bid_id, bid.amount);
    }
    async function finalize_redeem_bid_public(auction_id: field, bid_id: field) {
        // Ensure the bid is the winning bid.
        let winning_bid = winning_bids.get(auction_id);
        assert_eq(winning_bid, bid_id);

        // Ensure the bid hasn't been redeemed.
        let redeemed = redemptions.get(bid.auction_id);
        assert(redeemed == false);

       // Set the bid as redeemed.
        redeemed.set(auction_id, true);
    }

    // Redeem bid privately by transferring credits to the auctioneer and setting the bid as won.
    async transition redeem_bid_private(
        bid_id: field,
        bid: Bid,
        commit_key: group,
        redemption_ticket: RedemptionTicket,
        transfer_record: credits.aleo/Credits,
    ) -> (BidReceipt, Future) {
        // Prove the caller is owner of the bid.
        let expected_bid_id: field = BHP256::commit(bid, commit_key);
        assert_eq(expected_bid_id, bid_id);

        // Ensure the transfer record has enough credits to pay the balance.
        assert(transfer_record.balance >= bid.amount);

        // Transfer the the item to the auctioneer.
        credits.aleo/transfer_private(transfer_private, redemption_ticket.payout_address, redemption_ticket.amount);

        // Attempt to redeem the bid.
        finalize_redeem_bid_public(bid.auction_id, bid.bid_id, bid.amount);
    }
    async function finalize_redeem_bid_private(auction_id: field, bid_id: field) {
        // Ensure the bid is the winning bid.
        let winning_bid = winning_bids.get(auction_id);
        assert_eq(winning_bid, bid_id);

        // Ensure the bid hasn't been redeemed.
        let redeemed = redemptions.get(bid.auction_id);
        assert(redeemed == false);

       // Set the bid as redeemed.
        redeemed.set(auction_id, true);
    }
}

