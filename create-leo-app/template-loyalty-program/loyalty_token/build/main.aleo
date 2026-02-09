program loyalty_token.aleo;

struct CardIdInput:
    owner as address;
    nonce as field;
    points as u64;

struct AuditInput:
    card_id as field;
    old_points as u64;
    new_points as u64;

record LoyaltyCard:
    owner as address.private;
    card_id as field.private;
    points as u64.private;
    tier as u8.private;

mapping card_exists:
    key as field.public;
    value as boolean.public;

mapping total_cards:
    key as field.public;
    value as u64.public;

mapping total_points_issued:
    key as field.public;
    value as u64.public;

mapping point_audits:
    key as field.public;
    value as u64.public;

function mint_card:
    input r0 as address.public;
    input r1 as u64.public;
    input r2 as field.public;
    cast r0 r2 r1 into r3 as CardIdInput;
    hash.bhp256 r3 into r4 as field;
    gte r1 10000u64 into r5;
    ternary r5 2u8 0u8 into r6;
    gte r1 1000u64 into r7;
    ternary r7 1u8 r6 into r8;
    ternary r5 2u8 r8 into r9;
    cast r0 r4 r1 r9 into r10 as LoyaltyCard.record;
    async mint_card r4 into r11;
    output r10 as LoyaltyCard.record;
    output r11 as loyalty_token.aleo/mint_card.future;

finalize mint_card:
    input r0 as field.public;
    contains card_exists[r0] into r1;
    not r1 into r2;
    assert.eq r2 true;
    set true into card_exists[r0];
    get.or_use total_cards[0field] 0u64 into r3;
    add r3 1u64 into r4;
    set r4 into total_cards[0field];

function add_points:
    input r0 as LoyaltyCard.record;
    input r1 as u64.public;
    add r0.points r1 into r2;
    gte r2 10000u64 into r3;
    ternary r3 2u8 0u8 into r4;
    gte r2 1000u64 into r5;
    ternary r5 1u8 r4 into r6;
    ternary r3 2u8 r6 into r7;
    cast r0.card_id r0.points r2 into r8 as AuditInput;
    hash.bhp256 r8 into r9 as field;
    cast r0.owner r0.card_id r2 r7 into r10 as LoyaltyCard.record;
    async add_points r0.card_id r1 r9 into r11;
    output r10 as LoyaltyCard.record;
    output r11 as loyalty_token.aleo/add_points.future;

finalize add_points:
    input r0 as field.public;
    input r1 as u64.public;
    input r2 as field.public;
    get card_exists[r0] into r3;
    assert.eq r3 true;
    get.or_use total_points_issued[0field] 0u64 into r4;
    add r4 r1 into r5;
    set r5 into total_points_issued[0field];
    set r1 into point_audits[r2];

function check_points:
    input r0 as LoyaltyCard.record;
    output r0 as LoyaltyCard.record;
    output r0.points as u64.private;

function transfer_card:
    input r0 as LoyaltyCard.record;
    input r1 as address.public;
    cast r1 r0.card_id r0.points r0.tier into r2 as LoyaltyCard.record;
    async transfer_card r0.card_id into r3;
    output r2 as LoyaltyCard.record;
    output r3 as loyalty_token.aleo/transfer_card.future;

finalize transfer_card:
    input r0 as field.public;
    get card_exists[r0] into r1;
    assert.eq r1 true;
