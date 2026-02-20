import loyalty_token.aleo;
program loyalty_rewards.aleo;

record RewardVoucher:
    owner as address.private;
    voucher_id as field.private;
    reward_type as u8.private;
    amount as u64.private;

struct VoucherInput:
    card_id as field;
    reward_type as u8;
    cost as u64;

mapping voucher_exists:
    key as field.public;
    value as boolean.public;

mapping voucher_used:
    key as field.public;
    value as boolean.public;

mapping redemptions_by_type:
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
    output r2 as loyalty_rewards.aleo/approve_upgrade.future;

finalize approve_upgrade:
    input r0 as field.public;
    set true into approved_upgrades[r0];

function redeem_points_for_voucher:
    input r0 as loyalty_token.aleo/LoyaltyCard.record;
    input r1 as u8.private;
    input r2 as u64.private;
    gte r1 1u8 into r3;
    lte r1 3u8 into r4;
    and r3 r4 into r5;
    assert.eq r5 true;
    gte r2 100u64 into r6;
    assert.eq r6 true;
    gte r0.points r2 into r7;
    assert.eq r7 true;
    call loyalty_token.aleo/spend_points r0 r2 into r8;
    cast r0.card_id r1 r2 into r9 as VoucherInput;
    hash.bhp256 r9 into r10 as field;
    div r2 10u64 into r11;
    cast r0.owner r10 r1 r11 into r12 as RewardVoucher.record;
    async redeem_points_for_voucher r10 r1 into r13;
    output r8 as loyalty_token.aleo/LoyaltyCard.record;
    output r12 as RewardVoucher.record;
    output r13 as loyalty_rewards.aleo/redeem_points_for_voucher.future;

finalize redeem_points_for_voucher:
    input r0 as field.public;
    input r1 as u8.public;
    contains voucher_exists[r0] into r2;
    not r2 into r3;
    assert.eq r3 true;
    set true into voucher_exists[r0];
    cast r1 into r4 as field;
    get.or_use redemptions_by_type[r4] 0u64 into r5;
    add r5 1u64 into r6;
    set r6 into redemptions_by_type[r4];

function use_voucher:
    input r0 as RewardVoucher.record;
    async use_voucher r0.voucher_id into r1;
    output r1 as loyalty_rewards.aleo/use_voucher.future;

finalize use_voucher:
    input r0 as field.public;
    get voucher_exists[r0] into r1;
    assert.eq r1 true;
    get.or_use voucher_used[r0] false into r2;
    not r2 into r3;
    assert.eq r3 true;
    set true into voucher_used[r0];

function check_voucher:
    input r0 as RewardVoucher.record;
    cast r0.owner r0.voucher_id r0.reward_type r0.amount into r1 as RewardVoucher.record;
    output r1 as RewardVoucher.record;
    output r0.reward_type as u8.private;
    output r0.amount as u64.private;

function transfer_voucher:
    input r0 as RewardVoucher.record;
    input r1 as address.private;
    cast r1 r0.voucher_id r0.reward_type r0.amount into r2 as RewardVoucher.record;
    async transfer_voucher r0.voucher_id into r3;
    output r2 as RewardVoucher.record;
    output r3 as loyalty_rewards.aleo/transfer_voucher.future;

finalize transfer_voucher:
    input r0 as field.public;
    get voucher_exists[r0] into r1;
    assert.eq r1 true;
    get.or_use voucher_used[r0] false into r2;
    not r2 into r3;
    assert.eq r3 true;

constructor:
    gt edition 0u16 into r0;
    branch.eq r0 false to end_then_0_0;
    hash.bhp256 checksum into r1 as field;
    get approved_upgrades[r1] into r2;
    assert.eq r2 true;
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    position end_otherwise_0_1;
