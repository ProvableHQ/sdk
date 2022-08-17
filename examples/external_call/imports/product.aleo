// The 'product.aleo' program.
program product.aleo;

// Returns `r0 * r1`.
function product:
    input r0 as u32.public;
    input r1 as u32.private;
    mul r0 r1 into r2;
    output r2 as u32.private;
