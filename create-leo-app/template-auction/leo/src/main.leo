// A an auction contract.
program private_auction.aleo {

    ////////////////////////////////////////
    ///// ----- DATA DEFINITIONS ----- /////
    ////////////////////////////////////////

    // Description of an item's data.
    //
    //
    struct auction {
        minimum_bid: u64,
        name: field,
        offchain_data: [field; 4],
    }

    // Description of the auction_type.
    struct auction_settings {
        auction_type: field, // 0 = private, 1 = public
        bid_types_accepted: field, // 0 = private, 1 = public, 2 = mixed
    }

    // Bid data.
    struct bid {
        amount: u64,
        auction_id: field,
        owner: address,
    }

    ///////////////////////////////////
    ///// ----- PUBLIC DATA ----- /////
    ///////////////////////////////////

    ///// ----- AUCTION MAPPINGS ----- /////

    // Auction mapping identifying the owner of an auction for public auctions.
    mapping auction_owners field => address;

    // Bid count for an auction.
    mapping bid_count field => u64;

    //

    // Auction mapping of of whether an auction has been concluded, with the winning bids.
    mapping winning_bid field => field;

    // Auction mapping for public auctions.
    mapping public_auctions field => auction;

    // Determine what kind of bids are accepted.
    mapping public_auction_settings field => auction_settings;

    // Highest bid for public or mixed auction.
    mapping highest_bid field => u64;

    ///// ----- BID MAPPINGS ----- /////

    // Public bid id to bid_data.
    mapping public_bids field => bid;

    ////////////////////////////////////
    ///// ----- PRIVATE DATA ----- /////
    ////////////////////////////////////

    // Auction token representing a private auction.
    record AuctionToken {
        owner: address,
        auction: auction,
        auction_id: field,
        settings: auction_settings,
        is_open: bool,
    }

    // Create an invite representing an auction.
    record AuctionInvite {
        owner: address,
        auction: auction,
        auctioneer: address,
        auction_id: field,
    }

    // Create a bid receipt.
    record BidReceipt {
        owner: address,
        auction_id: field,
        bid: bid,
        bid_id: field,
    }

    // A bid in an auction.
    // - `owner`     : The address of the account that owns the record associated with this bid.
    // - `bidder`    : The address of the account that placed the bid.
    // - `amount`    : The amount of the bid.
    record PrivateBid {
        owner: address,
        bid: bid,
        bid_id: field,
    }

    // Bid receipt

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
    inline function create_auction(
        name: field,
        minimum_bid: u64,
        offchain_data: [field; 4],
        seller: address,
        is_private: field,
        nonce: scalar,
    ) -> (item, field, auction_settings) {
        // Assert that the bid types accepted are less than 3 (0 = private, 1 = public, 2 = mix).
        assert(bid_types_accepted < 3field);

        // Create the public key for the auction.
        let apk: group = nonce*group::GEN;
        let avk: field = nonce*(self.signer as group);

        // Create the auction settings.
        let settings = auction_settings {
            auction_type: is_private,
            bid_types_accepted,
        };

        // Create auction.
        let new_auction = auction {
            minimum_bid,
            name,
            offchain_data,
        };

        // Create an id.
        let auction_hash: field = BHP256::commit(new_auction, );

        // Return receipt.
        (new_auction, auction_id, auction_settings)
    }

    // Create a signed bid to auction.
    inline function create_bid(amount: u64, auction_id: field) -> (bid, bid_id)  {
        // Create the bid data.
        let bid = bid {
            amount,
            auction_id,
            self.caller,
        };

        // Create a bid id.
        let bid_id: field = Poseidon2::hash(bid);
        (bid, bid_id)
    }

    ///////////////////////////////////
    ///// ----- TRANSITIONS ----- /////
    ///////////////////////////////////

    // Create a private auction.
    async transition create_private_auction(
        name: field,
        minimum_bid: u64,
        offchain_data: [field; 4],
        bid_types_accepted: field
    ) -> (AuctionToken, Future) {
        // Create a signed auction.
        let (auction_item: auction, auction_id: field, settings: auction_settings) = create_auction(name, minimum_bid, offchain_data, self.caller, 0field);

        // Create an auction token for the auctioneer to use.
        let token = AuctionToken {
            owner: self.caller,
            auction: auction_item,
            auction_id,
            settings,
            is_open: true,
        };

        // Create a future that finalizes the auction.
        let create_auction_private_future: Future = finalize_create_private_auction(auction_item, auction_id);

        (token, create_auction_private_future)
    }
    async function finalize_create_private_auction(auction_item: auction, auction_id: field) {
        // Set the bid count.
        bid_count.set(auction_id, 0u64);

        // Set the highest_bid to 0.
        highest_bid.set(auction_id, 0u64);
    }

    // Create a new auction publicly.
    async transition create_public_auction(minimum_bid: u64, name: field, offchain_data: [field; 4], bid_types_accepted: field) -> (AuctionToken, Future) {
        // Create a signed auction.
        let (auction_item: auction, auction_id: field, settings: auction_settings) = create_auction(name, minimum_bid, offchain_data, self.caller, 1field);

        // Create an auction token for the auctioneer to use.
        let token = AuctionToken {
            owner: self.caller,
            auction: auction_item,
            auction_id,
            settings,
            is_open: true,
        };

        // Create a future that finalizes the auction.
        let create_auction_public_future: Future = finalize_create_public_auction(auction_item, auction_id, settings);
        let receipt = AuctionToken {
            owner: self.caller,
            auction,
            auction_id,
        };
        (receipt, create_auction_public_future)
    }
    // Finalize the creation of the auction.
    async function finalize_create_public_auction(auction_item: item, auction_id: field, settings: auction_settings) {
        // Set the auction owner.
        auction_owners.set(auction_id, self.caller);
        // Set the auction as open.
        bid_count.set(auction_id, 0u64);
        // Set the highest_bid to 0.
        highest_bid.set(auction_id, 0u64);
        // Set the open auction data.
        public_auctions.set(auction_id, auction);
        // Set the auction settings.
        public_auction_settings.set(auction_id, settings);
    }

    // Send a private invite to an auction. This function takes an auction receipt to ensure a the auctioneer is sending
    // an honest invite.
    transition invite_to_auction(receipt: AuctionToken, invitee: address) -> (AuctionInvite, AuctionToken) {
        // Ensure the bid data commitment matches the claimed data and that the auction is open.
        let auction_id = Poseidon2::hash(receipt.auction);
        assert_eq(receipt.auction_id, auction_id);

        // Ensure the auction is open.
        assert(receipt.is_open);

        // Ensure this function returns a receipt that can be used to invite another.
        let auction_token: AuctionToken = {
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
    async transition select_winner_private(bid: PrivateBid, auction_token: AuctionToken) {
        // Ensure the token owner is the caller.
        assert_eq(auction_token.owner, self.caller);
        assert(auction_token.is_open);

        bid._nonce

        // Ensure the bid settings aren't restricted to public bids.
        assert_neq(auction_token.settings.bid_types_accepted, 1field);

        // Ensure the token and bid are for the same auction.
        let claimed_auction_id = Poseidon2::hash(receipt.auction);
        assert_eq(auction_token.auction_id, claimed_auction_id);
        assert_eq(bid.auction.auction_id, claimed_auction_id);

        // Ensure the bid id is valid.
        let claimed_bid_id = Poseidon2::hash(bid);
        assert_eq(bid.bid_id, claimed_bid_id);

        let invalidated_token: AuctionToken = {
            owner: auction_token.owner,
            auction: auction_token.auction,
            auction_id: auction_token.auction_id,
            settings: auction_token.settings,
            is_open: false,
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
    async transition select_winner_public(bid: bid_id, auction_token: AuctionToken) {
        // Ensure the token owner is the caller.
        assert_eq(auction_token.owner, self.caller);
        assert_eq(auction_token.is_open);

        // Ensure the bid settings aren't restricted to private bids.
        assert_neq(auction_token.settings.bid_types_accepted, 0field);

        // Ensure the token and bid are for the same auction.
        let claimed_auction_id = Poseidon2::hash(receipt.auction);
        assert_eq(auction_token.auction_id, claimed_auction_id);
        assert_eq(bid.auction.auction_id, claimed_auction_id);

        let invalidated_token: AuctionToken = {
            owner: auction_token.owner,
            auction: auction_token.auction,
            auction_id: auction_token.auction_id,
            is_open: false,
        }

        // Finalize the selection of the winner.
        finalize_select_winner_private(claimed_auction_id, bid.bid_id);
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

    // Create a public bid.
    async transition create_public_bid(amount: u64, auction_id: field) -> (BidReceipt, Future) {
        // Create all bids.
        let (bid: Bid, bid_id: field) = create_bid(amount, auction_id);

        // Create a bid receipt.
        let receipt = BidReceipt {
            owner: self.caller,
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
    async transition create_private_bid(amount: u64, auction_id: field, invite: AuctionInvite) -> (AuctionInvite, BidReceipt, PrivateBid, Future) {
        // Create all bids.
        let (bid: Bid, bid_id: field) = create_bid(amount, auction_id);

        // Create a bid receipt.
        let private_bid = PrivateBid {
            owner: invite.auctioneer,
            bid,
            bid_id,
        };

        // Create a bid receipt.
        let receipt = BidReceipt {
            owner: self.caller,
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
    // Store public bid.
    async function finalize_create_private_bid(bid: Bid, bid_id: field) {
        // Set the bid.
        public_bids.set(bid_id, bid);

        // Increment the bid count.
        bid_count.set(bid.auction_id, bid_count.get(bid.auction_id) + 1);
    }
}

