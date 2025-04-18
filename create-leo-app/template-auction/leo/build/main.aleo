import credits.aleo;
program private_auction_test_2.aleo;

struct item:
    id as field;
    offchain_data as [field; 4u32];

struct auction:
    starting_bid as u64;
    name as field;
    item as item;

struct privacy_settings:
    auction_privacy as field;
    bid_types_accepted as field;

record AuctionTicket:
    owner as address.private;
    auction as auction.private;
    auction_id as field.private;
    settings as privacy_settings.private;

record AuctionInvite:
    owner as address.private;
    auction as auction.private;
    auctioneer as address.private;
    auction_id as field.private;

struct bid:
    amount as u64;
    auction_id as field;
    bid_public_key as group;

record BidReceipt:
    owner as address.private;
    auction_id as field.private;
    bid as bid.private;
    bid_id as field.private;

record PrivateBid:
    owner as address.private;
    bid as bid.private;
    bid_id as field.private;

mapping auctions:
    key as u64.public;
    value as field.public;

mapping bid_count:
    key as field.public;
    value as u64.public;

mapping auction_public_keys:
    key as field.public;
    value as group.public;

mapping winning_bids:
    key as field.public;
    value as field.public;

mapping public_auctions:
    key as field.public;
    value as auction.public;

mapping auction_owners:
    key as field.public;
    value as address.public;

mapping auction_privacy_settings:
    key as field.public;
    value as privacy_settings.public;

mapping highest_bids:
    key as field.public;
    value as u64.public;

mapping redemptions:
    key as field.public;
    value as boolean.public;

mapping public_bids:
    key as field.public;
    value as bid.public;

mapping public_bid_owners:
    key as field.public;
    value as address.public;

function create_private_auction:
    input r0 as field.private;
    input r1 as field.private;
    input r2 as field.private;
    input r3 as [field; 4u32].private;
    input r4 as u64.private;
    input r5 as scalar.private;
    lt r0 3field into r6;
    assert.eq r6 true;
    mul r5 1540945439182663264862696551825005342995406165131907382295858612069623286213group into r7;
    cast self.signer into r8 as group;
    mul r5 r8 into r9;
    cast 0field r0 into r10 as privacy_settings;
    cast r1 r3 into r11 as item;
    cast r4 r2 r11 into r12 as auction;
    hash.psd2 r12 into r13 as scalar;
    mul r13 r9 into r14;
    cast r14 into r15 as field;
    cast self.signer r12 r15 r10 into r16 as AuctionTicket.record;
    async create_private_auction r15 r7 into r17;
    output r16 as AuctionTicket.record;
    output r17 as private_auction_test_2.aleo/create_private_auction.future;

finalize create_private_auction:
    input r0 as field.public;
    input r1 as group.public;
    contains auction_public_keys[r0] into r2;
    not r2 into r3;
    assert.eq r3 true;
    set r1 into auction_public_keys[r0];

function create_public_auction:
    input r0 as field.private;
    input r1 as field.private;
    input r2 as field.private;
    input r3 as [field; 4u32].private;
    input r4 as u64.private;
    input r5 as scalar.private;
    input r6 as boolean.private;
    lt r1 3field into r7;
    assert.eq r7 true;
    mul r5 1540945439182663264862696551825005342995406165131907382295858612069623286213group into r8;
    cast self.signer into r9 as group;
    mul r5 r9 into r10;
    cast 1field r1 into r11 as privacy_settings;
    cast r2 r3 into r12 as item;
    cast r4 r0 r12 into r13 as auction;
    hash.psd2 r13 into r14 as scalar;
    mul r14 r10 into r15;
    cast r15 into r16 as field;
    cast self.signer r13 r16 r11 into r17 as AuctionTicket.record;
    async create_public_auction r13 r16 r8 self.signer r11 into r18;
    output r17 as AuctionTicket.record;
    output r18 as private_auction_test_2.aleo/create_public_auction.future;

finalize create_public_auction:
    input r0 as auction.public;
    input r1 as field.public;
    input r2 as group.public;
    input r3 as address.public;
    input r4 as privacy_settings.public;
    contains auction_public_keys[r1] into r5;
    not r5 into r6;
    assert.eq r6 true;
    is.neq r3 private_auction_test_2.aleo into r7;
    branch.eq r7 false to end_then_0_0;
    set r3 into auction_owners[r1];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    position end_otherwise_0_1;
    set r0 into public_auctions[r1];
    set r4 into auction_privacy_settings[r1];
    set r2 into auction_public_keys[r1];

function publish_address:
    input r0 as AuctionTicket.record;
    assert.eq r0.settings.auction_privacy 0field;
    async publish_address r0.auction_id self.signer into r1;
    output r0 as AuctionTicket.record;
    output r1 as private_auction_test_2.aleo/publish_address.future;

finalize publish_address:
    input r0 as field.public;
    input r1 as address.public;
    contains auction_public_keys[r0] into r2;
    assert.eq r2 true;
    set r1 into auction_owners[r0];

function publish_auction_data:
    input r0 as AuctionTicket.record;
    assert.eq r0.settings.auction_privacy 0field;
    async publish_auction_data r0.auction_id r0.auction into r1;
    output r0 as AuctionTicket.record;
    output r1 as private_auction_test_2.aleo/publish_auction_data.future;

finalize publish_auction_data:
    input r0 as field.public;
    input r1 as auction.public;
    contains public_auctions[r0] into r2;
    not r2 into r3;
    assert.eq r3 true;
    set r1 into public_auctions[r0];

function invite_to_auction:
    input r0 as AuctionTicket.record;
    input r1 as address.private;
    cast r1 r0.auction r0.owner r0.auction_id into r2 as AuctionInvite.record;
    output r2 as AuctionInvite.record;
    output r0 as AuctionTicket.record;

function select_winner_private:
    input r0 as AuctionTicket.record;
    input r1 as PrivateBid.record;
    assert.neq r0.settings.bid_types_accepted 1field;
    assert.eq r0.auction_id r1.bid.auction_id;
    gte r1.bid.amount r0.auction.starting_bid into r2;
    assert.eq r2 true;
    async select_winner_private r1.bid.amount r1.bid.auction_id r1.bid_id into r3;
    output r3 as private_auction_test_2.aleo/select_winner_private.future;

finalize select_winner_private:
    input r0 as u64.public;
    input r1 as field.public;
    input r2 as field.public;
    get.or_use highest_bids[r1] 0u64 into r3;
    assert.eq r0 r3;
    set r2 into winning_bids[r1];

function select_winner_public:
    input r0 as AuctionTicket.record;
    input r1 as bid.private;
    input r2 as field.private;
    assert.neq r0.settings.bid_types_accepted 0field;
    gte r1.amount r0.auction.starting_bid into r3;
    assert.eq r3 true;
    async select_winner_public r0.auction_id r2 r1 into r4;
    output r4 as private_auction_test_2.aleo/select_winner_public.future;

finalize select_winner_public:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as bid.public;
    get public_bids[r1] into r3;
    assert.eq r3 r2;
    get.or_use highest_bids[r0] 0u64 into r4;
    assert.eq r2.amount r4;
    set r1 into winning_bids[r0];

function bid_public:
    input r0 as u64.private;
    input r1 as field.private;
    input r2 as scalar.private;
    input r3 as boolean.private;
    mul r2 1540945439182663264862696551825005342995406165131907382295858612069623286213group into r4;
    cast r0 r1 r4 into r5 as bid;
    cast self.signer into r6 as group;
    mul r2 r6 into r7;
    hash.psd2 r5 into r8 as scalar;
    mul r8 r7 into r9;
    cast r9 into r10 as field;
    cast self.signer r1 r5 r10 into r11 as BidReceipt.record;
    ternary r3 self.signer private_auction_test_2.aleo into r12;
    async bid_public r5 r10 r12 into r13;
    output r11 as BidReceipt.record;
    output r13 as private_auction_test_2.aleo/bid_public.future;

finalize bid_public:
    input r0 as bid.public;
    input r1 as field.public;
    input r2 as address.public;
    contains auction_public_keys[r0.auction_id] into r3;
    assert.eq r3 true;
    contains winning_bids[r0.auction_id] into r4;
    not r4 into r5;
    assert.eq r5 true;
    contains public_bids[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    set r0 into public_bids[r1];
    get.or_use bid_count[r0.auction_id] 0u64 into r8;
    add r8 1u64 into r9;
    set r9 into bid_count[r0.auction_id];
    get.or_use highest_bids[r0.auction_id] 0u64 into r10;
    gt r0.amount r10 into r11;
    branch.eq r11 false to end_then_0_2;
    set r0.amount into highest_bids[r0.auction_id];
    branch.eq true true to end_otherwise_0_3;
    position end_then_0_2;
    position end_otherwise_0_3;
    is.neq r2 private_auction_test_2.aleo into r12;
    branch.eq r12 false to end_then_0_4;
    set r2 into public_bid_owners[r1];
    branch.eq true true to end_otherwise_0_5;
    position end_then_0_4;
    position end_otherwise_0_5;

function bid_private:
    input r0 as u64.private;
    input r1 as field.private;
    input r2 as address.private;
    input r3 as group.private;
    input r4 as scalar.private;
    mul r4 1540945439182663264862696551825005342995406165131907382295858612069623286213group into r5;
    cast r0 r1 r5 into r6 as bid;
    cast self.signer into r7 as group;
    mul r4 r7 into r8;
    hash.psd2 r6 into r9 as scalar;
    mul r9 r8 into r10;
    cast r10 into r11 as field;
    cast self.signer r1 r6 r11 into r12 as BidReceipt.record;
    cast r2 r6 r11 into r13 as PrivateBid.record;
    async bid_private r0 r1 into r14;
    output r12 as BidReceipt.record;
    output r13 as PrivateBid.record;
    output r14 as private_auction_test_2.aleo/bid_private.future;

finalize bid_private:
    input r0 as u64.public;
    input r1 as field.public;
    contains auction_public_keys[r1] into r2;
    assert.eq r2 true;
    contains winning_bids[r1] into r3;
    not r3 into r4;
    assert.eq r4 true;
    get.or_use bid_count[r1] 0u64 into r5;
    add r5 1u64 into r6;
    set r6 into bid_count[r1];
    get.or_use highest_bids[r1] 0u64 into r7;
    gt r0 r7 into r8;
    branch.eq r8 false to end_then_0_6;
    set r0 into highest_bids[r1];
    branch.eq true true to end_otherwise_0_7;
    position end_then_0_6;
    position end_otherwise_0_7;

function redeem_bid_public:
    input r0 as address.private;
    input r1 as BidReceipt.record;
    call credits.aleo/transfer_public_as_signer r0 r1.bid.amount into r2;
    async redeem_bid_public r0 r1.bid.auction_id r1.bid_id r2 into r3;
    output r3 as private_auction_test_2.aleo/redeem_bid_public.future;

finalize redeem_bid_public:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as credits.aleo/transfer_public_as_signer.future;
    get auction_owners[r1] into r4;
    assert.eq r4 r0;
    get winning_bids[r1] into r5;
    assert.eq r5 r2;
    get redemptions[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    await r3;
    set true into redemptions[r1];

function redeem_bid_private_to_public:
    input r0 as address.private;
    input r1 as BidReceipt.record;
    input r2 as credits.aleo/credits.record;
    gte r2.microcredits r1.bid.amount into r3;
    assert.eq r3 true;
    call credits.aleo/transfer_private_to_public r2 r0 r1.bid.amount into r4 r5;
    async redeem_bid_private_to_public r0 r1.bid.auction_id r1.bid_id r5 into r6;
    output r6 as private_auction_test_2.aleo/redeem_bid_private_to_public.future;

finalize redeem_bid_private_to_public:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as credits.aleo/transfer_private_to_public.future;
    get auction_owners[r1] into r4;
    assert.eq r4 r0;
    get winning_bids[r1] into r5;
    assert.eq r5 r2;
    get redemptions[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    await r3;
    set true into redemptions[r1];

function redeem_bid_private:
    input r0 as AuctionInvite.record;
    input r1 as BidReceipt.record;
    input r2 as credits.aleo/credits.record;
    gte r2.microcredits r1.bid.amount into r3;
    assert.eq r3 true;
    call credits.aleo/transfer_private r2 r0.auctioneer r1.bid.amount into r4 r5;
    async redeem_bid_private r1.bid.auction_id r1.bid_id into r6;
    output r6 as private_auction_test_2.aleo/redeem_bid_private.future;

finalize redeem_bid_private:
    input r0 as field.public;
    input r1 as field.public;
    get winning_bids[r0] into r2;
    assert.eq r2 r1;
    get redemptions[r0] into r3;
    not r3 into r4;
    assert.eq r4 true;
    set true into redemptions[r0];
