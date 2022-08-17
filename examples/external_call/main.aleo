// Import the 'difference.aleo' program.
import difference.aleo;
// Import the 'product.aleo' program.
import product.aleo;
// Import the 'quotient.aleo' program.
import quotient.aleo;
// Import the 'sum.aleo' program.
import sum.aleo;

// The 'external_call.aleo' program.
program external_call.aleo;

// Performs a sequence of arithmetic calls
// to demonstrate external calls in Aleo.
function main:
    // Input the first value.
    input r0 as u32.public;
    // Input the second value.
    input r1 as u32.private;

    // Creates a transition that evaluates `r0 * r1`.
    call product.aleo/product r0 r1 into r2;

    // Creates a transition that evaluates `r2 / r1`.
    call quotient.aleo/quotient r2 r1 into r3;

    // Creates a transition that evaluates `r3 + r0`.
    call sum.aleo/sum r3 r0 into r4;

    // Creates a transition that evaluates `r4 - r3`.
    call difference.aleo/difference r4 r3 into r5;

    // Ensure `r5 == r0`.
    assert.eq r5 r0;
    
    // Return `r5`.
    output r5 as u32.private;
