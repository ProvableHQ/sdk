program token.aleo;

record token:
    // The token owner.
    owner as address.private;
    // The Aleo balance (in gates).
    gates as u64.private;
    // The token balance.
    amount as u64.private;

// The `mint` function initializes a new record with the
// specified number of tokens in `r1` for the receiver in `r0`.
function mint:
    input r0 as address.private;
    input r1 as u64.private;
    cast r0 0u64 r1 into r2 as token.record;
    output r2 as token.record;

// The `transfer` function sends the specified number of tokens
// to the receiver from the provided token record.
function transfer:
    // Input the sender's record.
    input r0 as token.record;
    // Input the token receiver.
    input r1 as address.private;
    // Input the token amount.
    input r2 as u64.private;

    // Checks the given token record has sufficient balance.
    // This `sub` operation is safe, and the proof will fail
    // if an underflow occurs. The output register `r3` holds
    // the change amount to be returned to the sender.
    sub r0.amount r2 into r3;

    // Produces a token record for the specified receiver.
    cast r1 0u64 r2 into r4 as token.record;

    // Produces a token record with the change amount for the sender.
    cast r0.owner r0.gates r3 into r5 as token.record;

    // Output the receiver's record.
    output r4 as token.record;
    // Output the sender's change record.
    output r5 as token.record;
