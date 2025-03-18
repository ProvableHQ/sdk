program auction.aleo;

record Bid:
    owner as address.private;
    bidder as address.private;
    auction_id as field.private;
    amount as u64.private;
    is_winner as boolean.private;

function place_bid:
    input r0 as address.private;
    input r1 as address.private;
    input r2 as field.private;
    input r3 as u64.private;
    assert.eq self.caller r0;
    cast r1 r0 r2 r3 false into r4 as Bid.record;
    output r4 as Bid.record;

function resolve:
    input r0 as Bid.record;
    input r1 as Bid.record;
    assert.eq self.caller r0.owner;
    assert.eq self.caller r1.owner;
    gte r0.amount r1.amount into r2;
    not r2 into r3;
    ternary r2 r0.owner r1.owner into r4;
    ternary r2 r0.bidder r1.bidder into r5;
    ternary r2 r0.auction_id r1.auction_id into r6;
    ternary r2 r0.amount r1.amount into r7;
    ternary r2 r0.is_winner r1.is_winner into r8;
    cast r4 r5 r6 r7 r8 into r9 as Bid.record;
    output r9 as Bid.record;

function finish:
    input r0 as Bid.record;
    assert.eq self.caller r0.owner;
    cast r0.bidder r0.bidder r0.auction_id r0.amount true into r1 as Bid.record;
    output r1 as Bid.record;
