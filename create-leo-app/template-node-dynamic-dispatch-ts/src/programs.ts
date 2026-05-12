// ============================================================================
// Test 1: Dynamic Dispatch Programs (call.dynamic with imports)
// ============================================================================

// Leaf program 1: addition
export const DD_ADD_PROGRAM = `program dd_add.aleo;

function compute:
    input r0 as u32.public;
    input r1 as u32.public;
    add r0 r1 into r2;
    output r2 as u32.public;

constructor:
    assert.eq true true;
`;

// Leaf program 2: multiplication
export const DD_MUL_PROGRAM = `program dd_mul.aleo;

function compute:
    input r0 as u32.public;
    input r1 as u32.public;
    mul r0 r1 into r2;
    output r2 as u32.public;

constructor:
    assert.eq true true;
`;

// Caller: uses call.dynamic to dispatch to dd_add or dd_mul at runtime.
export function makeDDCallerProgram(): string {
    return `import dd_add.aleo;
import dd_mul.aleo;

program dd_caller.aleo;

function dynamic_compute:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u32.public;
    input r4 as u32.public;
    call.dynamic r0 r1 r2 with r3 r4 (as u32.public u32.public) into r5 (as u32.public);
    output r5 as u32.public;

constructor:
    assert.eq true true;
`;
}

// Mixed caller: statically calls dd_add, dynamically calls a program passed
// as field inputs. Tests that getCalledFunctions finds the static call (so
// dd_add keys are loaded from cache) while the dynamic target is re-synthesized.
//
// mixed_compute(program, network, function, a, b):
//   static_result  = dd_add.aleo/compute(a, b)     // static call
//   dynamic_result = call.dynamic(program, network, function, a, b)  // dynamic
//   output static_result + dynamic_result
export const MIXED_CALLER_PROGRAM = `import dd_add.aleo;
import dd_mul.aleo;

program mixed_caller.aleo;

function mixed_compute:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u32.public;
    input r4 as u32.public;
    call dd_add.aleo/compute r3 r4 into r5;
    call.dynamic r0 r1 r2 with r3 r4 (as u32.public u32.public) into r6 (as u32.public);
    add r5 r6 into r7;
    output r7 as u32.public;

constructor:
    assert.eq true true;
`;

// ============================================================================
// Test 2: Deeply Nested Static Import Chain (15 programs)
//
// Uses standard static `import` + `call program.aleo/function` — NOT
// call.dynamic. This tests the key caching pipeline for programs where
// getCalledFunctions can parse the call graph and loadKeysFromStore
// loads the correct keys from the KeyStore.
//
// Chain layout:
//   static_14.aleo (leaf)  — returns input + 1
//   static_13.aleo         — adds 1, calls static_14.aleo/call_next
//   ...
//   static_1.aleo          — adds 1, calls static_2.aleo/call_next
//   static_0.aleo (entry)  — calls static_1.aleo/call_next
//
// entry(0u64) → 14u64 (levels 1-14 each add 1; level 0 just forwards)
// ============================================================================

const DEFAULT_STATIC_CHAIN_DEPTH = 15;

export function makeStaticChainPrograms(depth: number = DEFAULT_STATIC_CHAIN_DEPTH, prefix: string = "static"): {
    programs: Map<string, string>;
    entryProgram: string;
} {
    const programs = new Map<string, string>();

    // Leaf program (deepest level) — no imports, just adds 1.
    const leafIdx = depth - 1;
    const leafName = `${prefix}_${leafIdx}.aleo`;
    programs.set(leafName, `program ${leafName};

function call_next:
    input r0 as u64.public;
    add r0 1u64 into r1;
    output r1 as u64.public;
`);

    // Intermediate programs (levels 1 through DEPTH-2).
    // Each imports the next level and uses a static call.
    for (let i = depth - 2; i >= 1; i--) {
        const name = `${prefix}_${i}.aleo`;
        const nextName = `${prefix}_${i + 1}.aleo`;
        programs.set(name, `import ${nextName};

program ${name};

function call_next:
    input r0 as u64.public;
    add r0 1u64 into r1;
    call ${nextName}/call_next r1 into r2;
    output r2 as u64.public;
`);
    }

    // Entry program (level 0) — imports level 1, forwards without adding.
    const entryName = `${prefix}_0.aleo`;
    const nextName = `${prefix}_1.aleo`;
    const entryProgram = `import ${nextName};

program ${entryName};

function entry:
    input r0 as u64.public;
    call ${nextName}/call_next r0 into r1;
    output r1 as u64.public;
`;
    programs.set(entryName, entryProgram);

    return { programs, entryProgram };
}

export const STATIC_CHAIN_EXPECTED_RESULT = DEFAULT_STATIC_CHAIN_DEPTH - 1; // levels 1..14 each add 1

// ============================================================================
// Test 3: Fan-Out Static Imports — One Program with MANY Direct Imports
//
// A single entry program that directly imports N leaf programs and calls
// a function in each one. This tests the scenario Mike described: "a
// program with a LOT of static imports."
//
// Layout:
//   leaf_0.aleo  — function add_val: returns input + 1
//   leaf_1.aleo  — function add_val: returns input + 1
//   ...
//   leaf_N.aleo  — function add_val: returns input + 1
//   fan_entry.aleo — imports all N leaves, chains calls:
//     call leaf_0.aleo/add_val r0 into r1;
//     call leaf_1.aleo/add_val r1 into r2;
//     ...
//     output rN as u64.public;
//
// entry(0u64) → Nu64 (each leaf adds 1)
// ============================================================================

const DEFAULT_FAN_OUT_WIDTH = 15;

export function makeFanOutPrograms(width: number = DEFAULT_FAN_OUT_WIDTH, prefix: string = "leaf", heavy: boolean = false): {
    programs: Map<string, string>;
    entryProgram: string;
    expectedResult: number;
} {
    const programs = new Map<string, string>();

    // Generate N leaf programs. When heavy=true, each function performs
    // multiple hash operations (BHP256, Poseidon2, Pedersen64) to inflate
    // the proving key size and stress memory.
    for (let i = 0; i < width; i++) {
        const name = `${prefix}_${i}.aleo`;
        if (heavy) {
            // Chain BHP256 and Poseidon2 hashes to inflate constraints.
            // The hash results are unused — we return the original add result.
            // This forces key synthesis to handle heavy circuits.
            programs.set(name, `program ${name};

function add_val:
    input r0 as u64.public;
    add r0 1u64 into r1;
    hash.bhp256 r1 into r2 as field;
    hash.psd2 r2 into r3 as field;
    hash.bhp256 r3 into r4 as field;
    hash.psd2 r4 into r5 as field;
    hash.bhp256 r5 into r6 as field;
    hash.psd2 r6 into r7 as field;
    output r1 as u64.public;
`);
        } else {
            programs.set(name, `program ${name};

function add_val:
    input r0 as u64.public;
    add r0 1u64 into r1;
    output r1 as u64.public;
`);
        }
    }

    // Entry program: imports ALL leaf programs and chains their calls.
    const importLines = [];
    const callLines = [];
    for (let i = 0; i < width; i++) {
        const leafName = `${prefix}_${i}.aleo`;
        importLines.push(`import ${leafName};`);
        const src = i === 0 ? "r0" : `r${i}`;
        const dst = `r${i + 1}`;
        callLines.push(`    call ${leafName}/add_val ${src} into ${dst};`);
    }

    const entryName = `${prefix}_entry.aleo`;
    const entryProgram = `${importLines.join("\n")}

program ${entryName};

function run_all:
    input r0 as u64.public;
${callLines.join("\n")}
    output r${width} as u64.public;
`;
    programs.set(entryName, entryProgram);

    return { programs, entryProgram, expectedResult: width };
}

export const FAN_OUT_EXPECTED_RESULT = DEFAULT_FAN_OUT_WIDTH; // each of 15 leaves adds 1
