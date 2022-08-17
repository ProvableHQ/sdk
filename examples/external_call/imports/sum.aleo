// The 'sum.aleo' program.
program sum.aleo;

// Returns `r0 + r1`.
function sum:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
