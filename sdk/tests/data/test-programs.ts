// Simple program with no imports — multiplies two u32 values.
export const MULTIPLY_PROGRAM = `program multiply_test.aleo;

function multiply:
    input r0 as u32.public;
    input r1 as u32.private;
    mul r0 r1 into r2;
    output r2 as u32.private;
`;

// Program that imports multiply_test.aleo and calls its multiply function.
// Note: function name cannot be "double" — it's a reserved opcode in snarkVM.
export const DOUBLE_PROGRAM = `import multiply_test.aleo;

program double_test.aleo;

function double_it:
    input r0 as u32.private;
    call multiply_test.aleo/multiply 2u32 r0 into r1;
    output r1 as u32.private;
`;

// Program that imports double_test.aleo (which itself imports multiply_test.aleo).
// Used to test transitive import resolution.
export const QUADRUPLE_PROGRAM = `import double_test.aleo;

program quadruple_test.aleo;

function quadruple_it:
    input r0 as u32.private;
    call double_test.aleo/double_it r0 into r1;
    call double_test.aleo/double_it r1 into r2;
    output r2 as u32.private;
`;

// Simple addition program — leaf node for deep chain tests.
export const ADD_PROGRAM = `program sum_test.aleo;

function sum_it:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
`;

// Imports sum_test.aleo — middle node for deep chain tests.
export const ADD_DOUBLE_PROGRAM = `import sum_test.aleo;

program sum_double_test.aleo;

function sum_double:
    input r0 as u32.private;
    call sum_test.aleo/sum_it 2u32 r0 into r1;
    output r1 as u32.private;
`;

// Imports sum_double_test.aleo (which imports sum_test.aleo) — top of 3-level chain.
export const ADD_QUAD_PROGRAM = `import sum_double_test.aleo;

program sum_quad_test.aleo;

function sum_quad:
    input r0 as u32.private;
    call sum_double_test.aleo/sum_double r0 into r1;
    call sum_double_test.aleo/sum_double r1 into r2;
    output r2 as u32.private;
`;

// Program with multiple functions, only some of which are called by importers.
export const MULTI_FN_PROGRAM = `program multi_fn_test.aleo;

function alpha:
    input r0 as u32.private;
    add r0 1u32 into r1;
    output r1 as u32.private;

function beta:
    input r0 as u32.private;
    mul r0 2u32 into r1;
    output r1 as u32.private;

function gamma:
    input r0 as u32.private;
    sub r0 1u32 into r1;
    output r1 as u32.private;
`;

// Program with two direct imports — used to test parallel BFS fetching.
export const MULTI_IMPORT_PROGRAM = `import multiply_test.aleo;
import sum_test.aleo;

program multi_import_test.aleo;

function compute:
    input r0 as u32.private;
    call multiply_test.aleo/multiply 2u32 r0 into r1;
    call sum_test.aleo/sum_it 1u32 r0 into r2;
    add r1 r2 into r3;
    output r3 as u32.private;
`;

// Calls two different functions in the same import — tests that both
// appear in calledFunctions for the same program.
export const CALLS_TWO_FNS_PROGRAM = `import multi_fn_test.aleo;

program calls_two_fns.aleo;

function use_both:
    input r0 as u32.private;
    call multi_fn_test.aleo/alpha r0 into r1;
    call multi_fn_test.aleo/beta r1 into r2;
    output r2 as u32.private;

function use_gamma:
    input r0 as u32.private;
    call multi_fn_test.aleo/gamma r0 into r1;
    output r1 as u32.private;
`;

// Two functions calling different imports — for scoped call-chain testing.
// Only the entry function's import should have keys loaded.
export const SCOPED_CALLER_PROGRAM = `import multiply_test.aleo;
import sum_test.aleo;

program scoped_caller.aleo;

function use_multiply:
    input r0 as u32.private;
    call multiply_test.aleo/multiply 2u32 r0 into r1;
    output r1 as u32.private;

function use_sum:
    input r0 as u32.private;
    call sum_test.aleo/sum_it 1u32 r0 into r1;
    output r1 as u32.private;
`;

// Program with a local closure call — tests intra-program call tracing.
export const CLOSURE_CALLER_PROGRAM = `import multiply_test.aleo;
import sum_test.aleo;

program closure_caller.aleo;

closure helper:
    input r0 as u32;
    mul r0 2u32 into r1;
    output r1 as u32;

function calls_via_closure:
    input r0 as u32.private;
    call helper r0 into r1;
    call multiply_test.aleo/multiply r1 r0 into r2;
    output r2 as u32.private;

function unrelated:
    input r0 as u32.private;
    call sum_test.aleo/sum_it 1u32 r0 into r1;
    output r1 as u32.private;
`;

// Calls only alpha from multi_fn_test.aleo — beta and gamma are uncalled.
export const CALLS_ALPHA_PROGRAM = `import multi_fn_test.aleo;

program calls_alpha_test.aleo;

function run_alpha:
    input r0 as u32.private;
    call multi_fn_test.aleo/alpha r0 into r1;
    output r1 as u32.private;
`;
