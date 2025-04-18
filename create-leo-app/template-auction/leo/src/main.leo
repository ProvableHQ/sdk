import credits.aleo;

// A an auction contract.
program private_auction_test_2.aleo {

    ////////////////////////////////////////
    ///// ----- DATA DEFINITIONS ----- /////
    ////////////////////////////////////////

    // Description of an item's data.
    // - `starting_bid`: The starting bid amount for the auction.
    // - `name`        : A unique name for the auction.
    // - `item`        : The item being auctioned.
    struct auction {
        starting_bid: u64,
        name: field,
        item: item,
    }

    // Description of an item being auctioned.
    // - `id`           : The unique id of the item.
    // - `offchain_data`: A link to offchain data for the item.
    struct item {
        id: field, // Unique id for the item.
        offchain_data: [field; 4], // Link to offchain data for the item.
    }

    // Description of the settings for the auction.
    // - `auction_privacy`   : The privacy of the auction (0 = private (auction data hidden), 1 = public (auction data public).
    // - `bid_types_accepted`: The types of bids accepted (0 = private (only private bids can be submitted), 1 = public (only private bids can be submitted), 2 = mix (public & private bids can be submitted)).
    struct privacy_settings {
        auction_privacy: field,
        bid_types_accepted: field,
    }

    // Description of a bid.
    // - `amount`        : The amount of the bid.
    // - `auction_id`    : The id of the auction.
    // - `bid_public_key`: The public key of the bid.
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
    mapping winning_bids: field => field;

    // Auction mapping for public auctions.
    mapping public_auctions: field => auction;
    
    // Auction mapping identifying the owner of an auction for public auctions.
    mapping auction_owners: field => address;

    // Determine what kind of bids are accepted.
    mapping auction_privacy_settings: field => privacy_settings;

    // Highest bid for public or mixed auction.
    mapping highest_bids: field => u64;

    // Record of auctions in which the bidder has redeemed their bid.
    mapping redemptions: field => bool;

    ///// ----- BID MAPPINGS ----- /////

    // Public bid id to bid_data.
    mapping public_bids: field => bid;

    // Map of public bid owners.
    mapping public_bid_owners: field => address;

    ////////////////////////////////////
    ///// ----- PRIVATE DATA ----- /////
    ////////////////////////////////////

    // Auction ticket representing an open auction. This ticket ensures the auctioneer honestly closes the bid.
    // - `owner`     : The auctioneer's address.
    // - `auction`   : The auction data.
    // - `auction_id`: The auction id.
    // - `settings`  : The auction settings.
    // - `is_open`   : Whether the auction is open or closed.
    record AuctionTicket {
        owner: address,
        auction: auction,
        auction_id: field,
        settings: privacy_settings,
    }

    // Create an invite representing an auction.
    // - `owner`     : The address of the account invited to bid.
    // - `auction`   : The auction data.
    // - `auctioneer`: The address of the auctioneer.
    // - `auction_id`: The auction id.
    record AuctionInvite {
        owner: address,
        auction: auction,
        auctioneer: address,
        auction_id: field,
    }

    // A bid receipt to ensure the bidder knows their own bids so it can discover them later.
    // - `owner`        : The address of the account that made the bid.
    // - `auction_id`   : The auction id.
    // - `bid`          : The bid data.
    // - `bid_id`      : The bid id.
    record BidReceipt {
        owner: address,
        auction_id: field,
        bid: bid,
        bid_id: field,
    }

    // A bid in an auction.
    // - `owner`     : The address of the auctioneer.
    // - `bid`       : The bid data.
    // - `bidder`    : The address of the bidder.
    // - `amount`    : The amount of the bid.
    record PrivateBid {
        owner: address,
        bid: bid,
        bid_id: field,
    }

    ////////////////////////////////////////
    ///// ----- INLINE FUNCTIONS ----- /////
    ////////////////////////////////////////

    inline create_bid(amount: u64, auction_id: field, nonce: scalar) -> (field, bid) {
        // Create the bid public key.
        let bid_public_key: group = nonce*group::GEN;

        // Create the bid data.
        let new_bid: bid = bid {
            amount,
            auction_id,
            bid_public_key,
        };

        // Create the bid committer key.
        let bid_commit_key: group = nonce*(self.signer as group);

        // Create the bid id.
        let bid_id: field = (Poseidon2::hash_to_scalar(new_bid)*bid_commit_key) as field;

        return (bid_id, new_bid);
    }


    ///////////////////////////////////
    ///// ----- TRANSITIONS ----- /////
    ///////////////////////////////////

    // Create a new auction privately. This function will create an open auction that hides both the auction data and
    // the auctioneer. The auctioneer will be able to publish their address and the auction data later if they would
    // like to solicit public bids.
    //
    // - `bid_types_accepted`: The privacy levels of the bids (0 = private, 1 = public, 2 = mix).
    // - `item_id`           : The id of the item being auctioned.
    // - `auction_name`      : The name of the item being auctioned.
    // - `item_offchain_data`: Link to offchain data for the item.
    // - `starting_bid`      : The starting bid for the auction.
    // - `nonce`             : A nonce derived from externally generated randomness.
    async transition create_private_auction(
        bid_types_accepted: field, // The privacy levels of the bids (0 = private, 1 = public, 2 = mix).
        item_id: field, // The id of the item being auctioned.
        auction_name: field, // The name of the item being auctioned.
        item_offchain_data: [field; 4], // Link to offchain data for the item.
        starting_bid: u64, // The starting bid for the auction.
        nonce: scalar, // A nonce derived from externally generated randomness.
    ) -> (AuctionTicket, Future) {
        // Assert that the bid types accepted are less than 3 (0 = private, 1 = public, 2 = mix).
        assert(bid_types_accepted < 3field);

        // Create the public key for the auction.
        let auction_public_key: group = nonce*group::GEN;

        // Create the auction commit key.
        let auction_commit_key: group = nonce*(self.signer as group);

        // Create the auction settings.
        let settings: privacy_settings = privacy_settings {
            auction_privacy: 0field,
            bid_types_accepted,
        };

        // Create the item.
        let auction_item: item = item {
            id: item_id,
            offchain_data: item_offchain_data,
        };

        // Create auction.
        let new_auction: auction = auction {
            starting_bid,
            name: auction_name,
            item: auction_item,
        };

        // Create an id.
        let auction_id: field = (Poseidon2::hash_to_scalar(new_auction)*auction_commit_key) as field;

        // Create an auction token for the auctioneer to use.
        let ticket: AuctionTicket = AuctionTicket {
            owner: self.signer,
            auction: new_auction,
            auction_id,
            settings,
        };

        // Create a future that finalizes the auction.
        let create_auction_private_future: Future = finalize_create_private_auction(auction_id, auction_public_key);

        // Return the auction ticket and future.
        return (ticket, create_auction_private_future);
    }
    async function finalize_create_private_auction(auction_id: field, apk: group) {
        // Ensure the auction doesn't already exist.
        assert(!auction_public_keys.contains(auction_id));

        // Set the auction public key to indicate it's start.
        auction_public_keys.set(auction_id, apk);
    }

    // Create a new auction publicly. This function will create an open auction that publicly exposes the auction data
    // and the auctioneer. The auctioneer will be able to solicit both private and public bids.
    //
    // - `bid_types_accepted`: The privacy levels of the bids (0 = private, 1 = public, 2 = mix).
    // - `item_id`           : The id of the item being auctioned.
    // - `auction_name`      : The name of the item being auctioned.
    // - `item_offchain_data`: Link to offchain data for the item.
    // - `starting_bid`      : The starting bid for the auction.
    // - `nonce`             : A nonce derived from externally generated randomness.
    // - `reveal_address`    : Whether to reveal the address of the auctioneer.
    async transition create_public_auction(
        auction_name: field, // The name of the auction.
        bid_types_accepted: field, // The privacy levels of the bids (0 = private, 1 = public, 2 = mix).
        item_id: field, // The id of the item being auctioned.
        item_offchain_data: [field; 4], // Link to offchain data for the item.
        starting_bid: u64, // The starting bid for the auction.
        nonce: scalar, // A nonce derived from externally generated randomness.
        reveal_address: bool, // Whether to reveal the address of the auctioneer.
    ) -> (AuctionTicket, Future) {
        // Assert that the bid types accepted are less than 3 (0 = private, 1 = public, 2 = mix).
        assert(bid_types_accepted < 3field);

        // Create the public key for the auction.
        let auction_public_key: group = nonce*group::GEN;

        // Create the auction commit key.
        let auction_commit_key: group = nonce*(self.signer as group);

        // Create the auction settings.
        let settings: privacy_settings = privacy_settings {
            auction_privacy: 1field,
            bid_types_accepted,
        };

        // Create the item.
        let auction_item: item = item {
            id: item_id,
            offchain_data: item_offchain_data,
        };

        // Create auction.
        let new_auction: auction = auction {
            starting_bid,
            name: auction_name,
            item: auction_item,
        };

        // Create an id.
        let auction_id: field = (Poseidon2::hash_to_scalar(new_auction)*auction_commit_key) as field;

        // Create an auction token for the auctioneer to use.
        let auction_ticket: AuctionTicket = AuctionTicket {
            owner: self.signer,
            auction: new_auction,
            auction_id,
            settings,
        };

        // Select address to reveal.
        let auctioneer: address = self.address;
        if reveal_address {
            // Publish the address of the auctioneer.
            auctioneer = self.signer;
        }

        // Create a future that finalizes the auction.
        let create_auction_public_future: Future = finalize_create_public_auction(new_auction, auction_id, auction_public_key, self.signer, settings);

        return (auction_ticket, create_auction_public_future);
    }

    // Finalize the creation of the auction.
    async function finalize_create_public_auction(new_auction: auction, auction_id: field, auction_public_key: group, auctioneer: address, settings: privacy_settings) {
        // Ensure the auction doesn't already exist.
        assert(!auction_public_keys.contains(auction_id));
        // Set the auction owner if the auctioneer is not the contract address.
        if auctioneer != self.address {
            // Publish the address of the auctioneer.
            auction_owners.set(auction_id, auctioneer);
        }
        // Set the open auction data.
        public_auctions.set(auction_id, new_auction);
        // Set the auction settings.
        auction_privacy_settings.set(auction_id, settings);
        // Set the auction public key.
        auction_public_keys.set(auction_id, auction_public_key);
    }

    // Publish the auctioneer address to chain for a private auction.
    async transition publish_address(auction_ticket: AuctionTicket) -> (AuctionTicket, Future) {
        // Ensure the auction is private, otherwise this is redundant.
        assert_eq(auction_ticket.settings.auction_privacy, 0field);

        // Ensure the auction exists.
        return (auction_ticket, finalize_publish_address(auction_ticket.auction_id, self.signer));
    }
    async function finalize_publish_address(auction_id: field, auctioneer: address) {
        // Ensure the auction exists.
        assert(auction_public_keys.contains(auction_id));

        // Set the auction address.
        auction_owners.set(auction_id, auctioneer);
    }

    // Publish the bid information to chain for a private auction.
    async transition publish_auction_data(auction_ticket: AuctionTicket) -> (AuctionTicket, Future) {
        // Ensure the auction is private, otherwise this is redundant.
        assert_eq(auction_ticket.settings.auction_privacy, 0field);

        // Ensure the auction exists.
        return (auction_ticket, finalize_publish_auction_data(auction_ticket.auction_id, auction_ticket.auction));
    }
    async function finalize_publish_auction_data(auction_id: field, auction_info: auction) {
        // Ensure the auction exists.
        assert(!public_auctions.contains(auction_id));

        // Set the auction address.
        public_auctions.set(auction_id, auction_info);
    }

    // Send a private invite to an auction. This function takes an auction receipt to ensure a the auctioneer is sending
    // an honest invite to an open auction. After receiving the record, the invitee will be able to bid on the auction
    // privately.
    //
    // - `auction_ticket`: The auction ticket for the auction.
    // - `invitee`       : The address of the invitee.
    transition invite_to_auction(
        auction_ticket: AuctionTicket,
        invitee: address
    ) -> (AuctionInvite, AuctionTicket) {
        // Create an auction invite.
        let auction_invite: AuctionInvite = AuctionInvite {
            owner: invitee,
            auctioneer: auction_ticket.owner,
            auction: auction_ticket.auction,
            auction_id: auction_ticket.auction_id,
        };

        return (auction_invite, auction_ticket);
    }

    // Select winner a set of private bids. This function will select the highest bid from a set of private bids and
    // finalize the auction. The auctioneer will be able to redeem the bid privately.
    //
    // - `auction_ticket`  : The auction ticket for the auction.
    // - `private_bid`     : The private bid to select as the winner.
    async transition select_winner_private(
        auction_ticket: AuctionTicket,
        private_bid: PrivateBid,
    ) -> Future {
        // Ensure the bid settings aren't restricted to public bids.
        assert_neq(auction_ticket.settings.bid_types_accepted, 1field);

        // Ensure the bid is for the correct auction.
        assert_eq(auction_ticket.auction_id, private_bid.bid.auction_id);

        // Ensure the bid amount is greater than the starting bid.
        assert(private_bid.bid.amount >= auction_ticket.auction.starting_bid);

        // Finalize the selection of the winner.
        return finalize_select_winner_private(private_bid.bid.amount, private_bid.bid.auction_id, private_bid.bid_id);
    }
    async function finalize_select_winner_private(
        amount: u64,
        auction_id: field,
        bid_id: field
    ) {
        // Get the bid to be selected to win.
        let highest_bid_amount: u64 = Mapping::get_or_use(highest_bids, auction_id, 0u64);

        // Ensure the bid is higher than the highest bid.
        assert_eq(amount, highest_bid_amount);

        // Set the bid as the winner. Thus closing the auction.
        winning_bids.set(auction_id, bid_id);
    }

    // Select winner from a set of public bids. This function will select the highest bid from a set of public bids and
    // finalize the auction. The auctioneer will be able to redeem the bid publicly or privately later.
    //
    // - `auction_ticket`  : The auction ticket for the auction.
    // - `winning_bid_id`  : The id of the winning bid.
    async transition select_winner_public(
        auction_ticket: AuctionTicket,
        winning_bid: bid,
        winning_bid_id: field,
    ) -> Future {
        // Ensure the bid settings aren't restricted to private bids.
        assert_neq(auction_ticket.settings.bid_types_accepted, 0field);

        // Ensure the winning bid is greater than the starting bid.
        assert(winning_bid.amount >= auction_ticket.auction.starting_bid);

        // Finalize the selection of the winner.
        let redemption_future: Future = finalize_select_winner_public(auction_ticket.auction_id, winning_bid_id, winning_bid);

        // Return the auction ticket and future.
        return redemption_future;
    }
    async function finalize_select_winner_public(auction_id: field, bid_id: field, winning_bid: bid) {
        // Get the bid to be selected to win.
        let stored_bid: bid = public_bids.get(bid_id);

        // Ensure the bid is for the correct auction.
        assert_eq(stored_bid, winning_bid);

        // Get the highest_bid for the auction and assert it's equal to the accepted bid.
        let highest_bid_amount: u64 = Mapping::get_or_use(highest_bids, auction_id, 0u64);

        // Ensure the bid is higher than the highest bid.
        assert_eq(winning_bid.amount, highest_bid_amount);

        // Set the bid as the winner. Thus closing the auction.
        winning_bids.set(auction_id, bid_id);
    }

    ///// ----- BIDDER TRANSITIONS ----- /////

    // Create a public bid. The bid info will be publicly visible, but the bidder will be able to remain anonymous if
    // they choose to.
    //
    // - `amount`                : The amount of the bid.
    // - `auction_id`            : The id of the auction.
    // - `nonce`                 : A nonce derived from externally generated randomness.
    // - `publish_bidder_address`: Whether to publish the address of the bidder, if the bidder wants to be anonymous, leave this as false.
    async transition bid_public(
        amount: u64,
        auction_id: field,
        nonce: scalar,
        publish_bidder_address: bool,
    ) -> (BidReceipt, Future) {
        // Create the bid public key.
        let bid_public_key: group = nonce*group::GEN;

        // Create the bid.
        let (bid_id, public_bid): (field, bid) = create_bid(amount, auction_id, nonce);

        // Create a bid receipt.
        let receipt: BidReceipt = BidReceipt {
            owner: self.signer,
            auction_id,
            bid: public_bid,
            bid_id,
        };

        // Optionally hide the bidder's address.
        let bid_address: address = self.address;
        if publish_bidder_address {
            // Publish the address of the bidder.
            bid_address = self.signer;
        }

        let finalize_bid_future: Future = finalize_bid_public(public_bid, bid_id, bid_address);
        return (receipt, finalize_bid_future);
    }
    async function finalize_bid_public(public_bid: bid, bid_id: field, bid_address: address) {
        // Ensure auction has been created.
        assert(auction_public_keys.contains(public_bid.auction_id));

        // Ensure the auction is open.
        assert(!winning_bids.contains(public_bid.auction_id));

        // Ensure the bid hasn't yet been created.
        assert(!public_bids.contains(bid_id));

        // Set the bid.
        public_bids.set(bid_id, public_bid);

        // Increment the bid count.
        bid_count.set(public_bid.auction_id, Mapping::get_or_use(bid_count, public_bid.auction_id, 0u64) + 1u64);

        // Get the highest bid amount and if it's greater than the current highest bid, set it.
        let highest_bid_amount: u64 = Mapping::get_or_use(highest_bids, public_bid.auction_id, 0u64);
        if public_bid.amount > highest_bid_amount {
            highest_bids.set(public_bid.auction_id, public_bid.amount);
        }

        if bid_address != self.address {
            // Publish the address of the bidder.
            public_bid_owners.set(bid_id, bid_address);
        }
    }

    // Bid on an auction privately. This function will create a private bid that is sent to the auctioneer.
    //
    // - `amount`            : The amount of the bid.
    // - `auction_id`        : The id of the auction.
    // - `auctioneer`        : The address of the auctioneer.
    // - `auction_public_key`: The public key of the auction.
    // - `nonce`             : A nonce derived from externally generated randomness.
    async transition bid_private(
        amount: u64,
        auction_id: field,
        auctioneer: address,
        auction_public_key: group,
        nonce: scalar,
    ) -> (BidReceipt, PrivateBid, Future) {
        // Create the bid.
        let (bid_id, private_bid): (field, bid) = create_bid(amount, auction_id, nonce);

        // Create a bid receipt.
        let receipt: BidReceipt = BidReceipt {
            owner: self.signer,
            auction_id,
            bid: private_bid,
            bid_id,
        };

        // A private bid.
        let private_bid_record: PrivateBid = PrivateBid {
            owner: auctioneer,
            bid: private_bid,
            bid_id,
        };

        return (receipt, private_bid_record, finalize_bid_private(amount, auction_id));
    }
    async function finalize_bid_private(amount: u64, auction_id: field) {
        // Ensure the auction has been created.
        assert(auction_public_keys.contains(auction_id));

        // Check if the auction is open.
        assert(!winning_bids.contains(auction_id));

        // Increment the bid count.
        bid_count.set(auction_id, Mapping::get_or_use(bid_count, auction_id, 0u64) + 1u64);

        // Set the bid amount.
        let highest_amount: u64 = Mapping::get_or_use(highest_bids, auction_id, 0u64);

        // If the bid is higher than the highest bid, set the bid as the highest bid.
        if amount > highest_amount {
            highest_bids.set(auction_id, amount);
        }
    }

    // Redeem a winning bid publicly. This function will transfer the credits to the auctioneer publicly and set the bid
    // as redeemed, thus closing the auction.
    //
    // - `auctioneer`  : The address of the auctioneer.
    // - `bid_receipt` : The bid receipt matching the bid.
    async transition redeem_bid_public(
        auctioneer: address,
        bid_receipt: BidReceipt, // The bid receipt matching the bid.,
    ) -> Future {
        // Ensure the auctioneer is the owner of the auction.
        let transfer_public: Future = credits.aleo/transfer_public_as_signer(auctioneer, bid_receipt.bid.amount);

        // Attempt to redeem the bid and transfer the credits.
        return finalize_redeem_bid_public(auctioneer, bid_receipt.bid.auction_id, bid_receipt.bid_id, transfer_public);
    }
    async function finalize_redeem_bid_public(auctioneer: address, auction_id: field, bid_id: field, transfer: Future) {
        // Ensure the auctioneer is the owner of the auction.
        assert_eq(auction_owners.get(auction_id), auctioneer);

        // Ensure the bid is the winner.
        let winning_bid_id: field = winning_bids.get(auction_id);
        assert_eq(winning_bid_id, bid_id);

        // Ensure the bid hasn't been redeemed.
        assert(!redemptions.get(auction_id));

        // Allow the transfer to complete.
        transfer.await();

       // Set the bid as redeemed.
        redemptions.set(auction_id, true);
    }

    // Redeem a winning bid anonymously, but transfer the credits to an auctioneer's public address. This function will
    // transfer the credits to the auctioneer and set the bid as redeemed, thus closing the auction.
    //
    // - `auctioneer`     : The address of the auctioneer.
    // - `bid_receipt`    : The bid receipt matching the bid.
    // - `transfer_record`: The transfer record to use for the transfer.
    async transition redeem_bid_private_to_public(
        auctioneer: address, // The auctioneer's address.
        bid_receipt: BidReceipt, // The bid receipt matching the bid.
        transfer_record: credits.aleo/credits,
    ) -> Future {
        // Ensure the transfer record has enough credits to pay the balance.
        assert(transfer_record.microcredits >= bid_receipt.bid.amount);

        // Transfer the the item to the auctioneer.
        let transfer_private_to_public: (credits.aleo/credits, Future)= credits.aleo/transfer_private_to_public(transfer_record, auctioneer, bid_receipt.bid.amount);

        // Attempt to redeem the bid and transfer the credits to the auctioneer.
        return finalize_redeem_bid_p2p(auctioneer, bid_receipt.bid.auction_id, bid_receipt.bid_id, transfer_private_to_public.1);
    }
    async function finalize_redeem_bid_p2p(auctioneer: address, auction_id: field, bid_id: field, transfer: Future) {
        // Ensure the auctioneer is the owner of the auction.
        assert_eq(auction_owners.get(auction_id), auctioneer);

        // Ensure the bid is the winner.
        let winning_bid_id: field = winning_bids.get(auction_id);
        assert_eq(winning_bid_id, bid_id);

        // Ensure the bid hasn't been redeemed.
        assert(!redemptions.get(auction_id));

        // Allow the transfer to complete.
        transfer.await();

       // Set the bid as redeemed.
        redemptions.set(auction_id, true);
    }

    // Redeem bid anonymously and transfer credits privately to the auctioneer. This function will transfer the credits
    // to the auctioneer and set the bid as redeemed, thus closing the auction.
    //
    // - `invite`         : The auction invite.
    // - `bid_receipt`    : The bid receipt matching the bid.
    // - `transfer_record`: The transfer record to use for the transfer.
    async transition redeem_bid_private(
        invite: AuctionInvite,
        bid_receipt: BidReceipt,
        transfer_record: credits.aleo/credits,
    ) -> Future {
        // Ensure the transfer record has enough credits to pay the balance.
        assert(transfer_record.microcredits >= bid_receipt.bid.amount);

        // Transfer the the item to the auctioneer.
        credits.aleo/transfer_private(transfer_record, invite.auctioneer, bid_receipt.bid.amount);

        // Attempt to redeem the bid.
        return finalize_redeem_bid_private(bid_receipt.bid.auction_id, bid_receipt.bid_id);
    }
    async function finalize_redeem_bid_private(auction_id: field, bid_id: field) {
        // Ensure the bid is the winner.
        let winning_bid_id: field = winning_bids.get(auction_id);
        assert_eq(winning_bid_id, bid_id);

        // Ensure the bid hasn't been redeemed.
        assert(!redemptions.get(auction_id));

       // Set the bid as redeemed.
        redemptions.set(auction_id, true);
    }
}

