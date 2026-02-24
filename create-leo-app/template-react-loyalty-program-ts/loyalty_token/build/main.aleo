program loyalty_token.aleo;

record LoyaltyCard:
    owner as address.private;
    card_id as field.private;
    points as u64.private;
    tier as u8.private;

struct CardIdInput:
    holder as address;
    nonce as field;
    points as u64;

mapping card_exists:
    key as field.public;
    value as boolean.public;

mapping total_cards:
    key as field.public;
    value as u64.public;

mapping total_points_issued:
    key as field.public;
    value as u64.public;

mapping approved_upgrades:
    key as field.public;
    value as boolean.public;

function approve_upgrade:
    input r0 as [u8; 32u32].private;
    assert.eq self.caller aleo1ntkc8z9ea8gjp7pkudlh5xqj0xw8k86lc64yh7yd06708ye9gv9s6j8l45;
    hash.bhp256 r0 into r1 as field;
    async approve_upgrade r1 into r2;
    output r2 as loyalty_token.aleo/approve_upgrade.future;

finalize approve_upgrade:
    input r0 as field.public;
    set true into approved_upgrades[r0];

function mint_card:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as field.private;
    cast r0 r2 r1 into r3 as CardIdInput;
    hash.bhp256 r3 into r4 as field;
    gte r1 10000u64 into r5;
    gte r1 1000u64 into r6;
    ternary r6 1u8 0u8 into r7;
    ternary r5 2u8 r7 into r8;
    cast r0 r4 r1 r8 into r9 as LoyaltyCard.record;
    async mint_card r4 into r10;
    output r9 as LoyaltyCard.record;
    output r10 as loyalty_token.aleo/mint_card.future;

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
    input r1 as u64.private;
    add r0.points r1 into r2;
    gte r2 10000u64 into r3;
    gte r2 1000u64 into r4;
    ternary r4 1u8 0u8 into r5;
    ternary r3 2u8 r5 into r6;
    cast r0.owner r0.card_id r2 r6 into r7 as LoyaltyCard.record;
    async add_points r0.card_id r1 into r8;
    output r7 as LoyaltyCard.record;
    output r8 as loyalty_token.aleo/add_points.future;

finalize add_points:
    input r0 as field.public;
    input r1 as u64.public;
    get card_exists[r0] into r2;
    assert.eq r2 true;
    get.or_use total_points_issued[0field] 0u64 into r3;
    add r3 r1 into r4;
    set r4 into total_points_issued[0field];

function check_points:
    input r0 as LoyaltyCard.record;
    cast r0.owner r0.card_id r0.points r0.tier into r1 as LoyaltyCard.record;
    output r1 as LoyaltyCard.record;
    output r0.points as u64.private;

function transfer_card:
    input r0 as LoyaltyCard.record;
    input r1 as address.private;
    cast r1 r0.card_id r0.points r0.tier into r2 as LoyaltyCard.record;
    async transfer_card r0.card_id into r3;
    output r2 as LoyaltyCard.record;
    output r3 as loyalty_token.aleo/transfer_card.future;

finalize transfer_card:
    input r0 as field.public;
    get card_exists[r0] into r1;
    assert.eq r1 true;

function split_card:
    input r0 as LoyaltyCard.record;
    input r1 as u64.private;
    input r2 as field.private;
    lt r1 r0.points into r3;
    assert.eq r3 true;
    sub r0.points r1 into r4;
    gte r1 10000u64 into r5;
    gte r1 1000u64 into r6;
    ternary r6 1u8 0u8 into r7;
    ternary r5 2u8 r7 into r8;
    cast r0.owner r0.card_id r1 r8 into r9 as LoyaltyCard.record;
    cast r0.owner r2 r4 into r10 as CardIdInput;
    hash.bhp256 r10 into r11 as field;
    gte r4 10000u64 into r12;
    gte r4 1000u64 into r13;
    ternary r13 1u8 0u8 into r14;
    ternary r12 2u8 r14 into r15;
    cast r0.owner r11 r4 r15 into r16 as LoyaltyCard.record;
    async split_card r0.card_id r11 into r17;
    output r9 as LoyaltyCard.record;
    output r16 as LoyaltyCard.record;
    output r17 as loyalty_token.aleo/split_card.future;

finalize split_card:
    input r0 as field.public;
    input r1 as field.public;
    get card_exists[r0] into r2;
    assert.eq r2 true;
    set true into card_exists[r1];
    get.or_use total_cards[0field] 0u64 into r3;
    add r3 1u64 into r4;
    set r4 into total_cards[0field];

function split_card_v2:
    input r0 as LoyaltyCard.record;
    input r1 as u64.private;
    lt r1 r0.points into r2;
    assert.eq r2 true;
    sub r0.points r1 into r3;
    gte r1 10000u64 into r4;
    gte r1 1000u64 into r5;
    ternary r5 1u8 0u8 into r6;
    ternary r4 2u8 r6 into r7;
    cast r0.owner r0.card_id r1 r7 into r8 as LoyaltyCard.record;
    hash.bhp256 r0 into r9 as field;
    cast r0.owner r9 r3 into r10 as CardIdInput;
    hash.bhp256 r10 into r11 as field;
    gte r3 10000u64 into r12;
    gte r3 1000u64 into r13;
    ternary r13 1u8 0u8 into r14;
    ternary r12 2u8 r14 into r15;
    cast r0.owner r11 r3 r15 into r16 as LoyaltyCard.record;
    async split_card_v2 r0.card_id r11 into r17;
    output r8 as LoyaltyCard.record;
    output r16 as LoyaltyCard.record;
    output r17 as loyalty_token.aleo/split_card_v2.future;

finalize split_card_v2:
    input r0 as field.public;
    input r1 as field.public;
    get card_exists[r0] into r2;
    assert.eq r2 true;
    set true into card_exists[r1];
    get.or_use total_cards[0field] 0u64 into r3;
    add r3 1u64 into r4;
    set r4 into total_cards[0field];

function spend_points:
    input r0 as LoyaltyCard.record;
    input r1 as u64.private;
    gte r0.points r1 into r2;
    assert.eq r2 true;
    sub r0.points r1 into r3;
    gte r3 10000u64 into r4;
    gte r3 1000u64 into r5;
    ternary r5 1u8 0u8 into r6;
    ternary r4 2u8 r6 into r7;
    cast r0.owner r0.card_id r3 r7 into r8 as LoyaltyCard.record;
    output r8 as LoyaltyCard.record;

constructor:
    gt edition 0u16 into r0;
    branch.eq r0 false to end_then_0_0;
    hash.bhp256 checksum into r1 as field;
    get approved_upgrades[r1] into r2;
    assert.eq r2 true;
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    position end_otherwise_0_1;
