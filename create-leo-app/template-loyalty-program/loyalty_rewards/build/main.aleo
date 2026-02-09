import loyalty_token.aleo;

program loyalty_rewards.aleo;

struct VoucherInput:
    card_id as field;
    reward_type as u8;
    cost as u64;

record RewardVoucher:
    owner as address.private;
    voucher_id as field.private;
    reward_type as u8.private;
    value as u64.private;

mapping voucher_exists:
    key as field.public;
    value as boolean.public;

mapping voucher_used:
    key as field.public;
    value as boolean.public;

mapping redemptions_by_type:
    key as field.public;
    value as u64.public;

mapping rewards_catalog:
    key as u8.public;
    value as u64.public;

function redeem_for_voucher:
    input r0 as loyalty_token.aleo/LoyaltyCard.record;
    input r1 as u8.public;
    input r2 as u64.public;
    gte r0.points r2 into r3;
    assert.eq r3 true;
    gte r1 1u8 into r4;
    lte r1 3u8 into r5;
    and r4 r5 into r6;
    assert.eq r6 true;
    cast r0.card_id r1 r2 into r7 as VoucherInput;
    hash.bhp256 r7 into r8 as field;
    sub r0.points r2 into r9;
    cast r0.owner r0.card_id r9 r0.tier into r10 as loyalty_token.aleo/LoyaltyCard.record;
    div r2 10u64 into r11;
    cast r0.owner r8 r1 r11 into r12 as RewardVoucher.record;
    async redeem_for_voucher r8 r1 into r13;
    output r10 as loyalty_token.aleo/LoyaltyCard.record;
    output r12 as RewardVoucher.record;
    output r13 as loyalty_rewards.aleo/redeem_for_voucher.future;

finalize redeem_for_voucher:
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
    output r0 as RewardVoucher.record;
    output r0.reward_type as u8.private;
    output r0.value as u64.private;

function transfer_voucher:
    input r0 as RewardVoucher.record;
    input r1 as address.public;
    cast r1 r0.voucher_id r0.reward_type r0.value into r2 as RewardVoucher.record;
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
