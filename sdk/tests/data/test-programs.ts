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

// Batches multiple credits.aleo records into a single private transfer.
// Mirrors snarkVM's construct_authorization_examples program source.
// https://testnet.explorer.provable.com/program/ldgbatcher_p28.aleo
export const LDGBATCHER_P28_PROGRAM = `import credits.aleo;

program ldgbatcher_p28.aleo;

function transfer_private_2:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as address.private;
    input r3 as u64.private;
    call credits.aleo/join r0 r1 into r4;
    call credits.aleo/transfer_private r4 r2 r3 into r5 r6;
    output r5 as credits.aleo/credits.record;
    output r6 as credits.aleo/credits.record;

function transfer_private_3:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as address.private;
    input r4 as u64.private;
    call credits.aleo/join r0 r1 into r5;
    call credits.aleo/join r2 r5 into r6;
    call credits.aleo/transfer_private r6 r3 r4 into r7 r8;
    output r7 as credits.aleo/credits.record;
    output r8 as credits.aleo/credits.record;

function transfer_private_4:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as address.private;
    input r5 as u64.private;
    call credits.aleo/join r0 r1 into r6;
    call credits.aleo/join r2 r6 into r7;
    call credits.aleo/join r3 r7 into r8;
    call credits.aleo/transfer_private r8 r4 r5 into r9 r10;
    output r9 as credits.aleo/credits.record;
    output r10 as credits.aleo/credits.record;

function transfer_private_5:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as address.private;
    input r6 as u64.private;
    call credits.aleo/join r0 r1 into r7;
    call credits.aleo/join r2 r7 into r8;
    call credits.aleo/join r3 r8 into r9;
    call credits.aleo/join r4 r9 into r10;
    call credits.aleo/transfer_private r10 r5 r6 into r11 r12;
    output r11 as credits.aleo/credits.record;
    output r12 as credits.aleo/credits.record;

function transfer_private_6:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as address.private;
    input r7 as u64.private;
    call credits.aleo/join r0 r1 into r8;
    call credits.aleo/join r2 r8 into r9;
    call credits.aleo/join r3 r9 into r10;
    call credits.aleo/join r4 r10 into r11;
    call credits.aleo/join r5 r11 into r12;
    call credits.aleo/transfer_private r12 r6 r7 into r13 r14;
    output r13 as credits.aleo/credits.record;
    output r14 as credits.aleo/credits.record;

function transfer_private_7:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as address.private;
    input r8 as u64.private;
    call credits.aleo/join r0 r1 into r9;
    call credits.aleo/join r2 r9 into r10;
    call credits.aleo/join r3 r10 into r11;
    call credits.aleo/join r4 r11 into r12;
    call credits.aleo/join r5 r12 into r13;
    call credits.aleo/join r6 r13 into r14;
    call credits.aleo/transfer_private r14 r7 r8 into r15 r16;
    output r15 as credits.aleo/credits.record;
    output r16 as credits.aleo/credits.record;

function transfer_private_8:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as credits.aleo/credits.record;
    input r8 as address.private;
    input r9 as u64.private;
    call credits.aleo/join r0 r1 into r10;
    call credits.aleo/join r2 r10 into r11;
    call credits.aleo/join r3 r11 into r12;
    call credits.aleo/join r4 r12 into r13;
    call credits.aleo/join r5 r13 into r14;
    call credits.aleo/join r6 r14 into r15;
    call credits.aleo/join r7 r15 into r16;
    call credits.aleo/transfer_private r16 r8 r9 into r17 r18;
    output r17 as credits.aleo/credits.record;
    output r18 as credits.aleo/credits.record;

constructor:
    assert.eq edition 0u16;
`;
