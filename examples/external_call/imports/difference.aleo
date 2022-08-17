// The 'difference.aleo' program.
program difference.aleo;

// Returns `r0 - r1`.
function difference:
    input r0 as u32.public;
    input r1 as u32.private;
    sub r0 r1 into r2;
    output r2 as u32.private;
