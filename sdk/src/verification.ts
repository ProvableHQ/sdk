/**
 * Diagnostic verification utilities for execution proofs and DPS responses.
 *
 * These wrappers provide structured results instead of bare booleans, letting agents
 * reason about verification failures without string parsing.
 */

import {
    ExecutionResponse,
    Execution as FunctionExecution,
    verifyFunctionExecution,
} from "./wasm.js";
import { ImportedPrograms, ImportedVerifyingKeys } from "./models/imports.js";

/** Structured result from execution verification. */
export interface VerificationResult {
    /** Whether the execution proof is valid. */
    valid: boolean;
    /** Program ID that was verified. */
    programId?: string;
    /** Function name that was verified. */
    functionName?: string;
    /** Diagnostic error message if invalid. */
    error?: string;
}

/**
 * Verify a function execution with diagnostic output.
 *
 * Wraps the WASM `verifyFunctionExecution` call and catches exceptions,
 * mapping them to diagnostic strings instead of silently returning false.
 *
 * @param executionResponse - The execution response to verify.
 * @param blockHeight - The block height for verification context.
 * @param imports - Optional imported program sources.
 * @param importedVerifyingKeys - Optional imported verifying keys.
 * @returns Structured verification result with diagnostics.
 */
export function verifyExecution(
    executionResponse: ExecutionResponse,
    blockHeight: number,
    imports?: ImportedPrograms,
    importedVerifyingKeys?: ImportedVerifyingKeys,
): VerificationResult {
    let programId: string | undefined;
    let functionName: string | undefined;

    try {
        const execution = <FunctionExecution>executionResponse.getExecution();
        const functionId = executionResponse.getFunctionId();
        const program = executionResponse.getProgram();
        const verifyingKey = executionResponse.getVerifyingKey();

        programId = program?.toString();
        functionName = functionId;

        const valid = verifyFunctionExecution(
            execution,
            verifyingKey,
            program,
            functionId,
            imports,
            importedVerifyingKeys,
            blockHeight,
        );

        return {
            valid,
            programId,
            functionName,
            error: valid ? undefined : "Proof verification returned false",
        };
    } catch (e: any) {
        return {
            valid: false,
            programId,
            functionName,
            error: `Verification exception: ${e?.message ?? String(e)}`,
        };
    }
}

/** Description of expected output at a specific position. */
export interface OutputCheck {
    /** Index of the transition in the execution. */
    transitionIndex: number;
    /** Index of the output within the transition. */
    outputIndex: number;
    /** Expected output type. */
    expectedType: "record" | "future" | "public";
    /** For public outputs, optionally check exact value. */
    expectedValue?: string;
}

/** Result of output structural validation. */
export interface OutputCheckResult {
    /** Whether all checks passed. */
    passed: boolean;
    /** List of failure descriptions. */
    failures: string[];
}

/**
 * Validate that execution outputs match expected structure.
 *
 * This is NOT cryptographic verification — it's structural validation that agents
 * use to confirm outputs match expectations (e.g., "transition 0, output 0 should be a record").
 *
 * @param outputs - Array of output strings from the execution response.
 * @param checks - Array of expected output checks.
 * @returns Whether all checks passed, with failure descriptions.
 */
export function checkExecutionOutputs(
    outputs: string[],
    checks: OutputCheck[],
): OutputCheckResult {
    const failures: string[] = [];

    for (const check of checks) {
        const key = `transition[${check.transitionIndex}].output[${check.outputIndex}]`;
        const idx = check.transitionIndex * 100 + check.outputIndex; // simplified flat index

        if (idx >= outputs.length) {
            failures.push(`${key}: output does not exist (only ${outputs.length} outputs)`);
            continue;
        }

        const output = outputs[idx];

        if (check.expectedValue !== undefined && output !== check.expectedValue) {
            failures.push(`${key}: expected value "${check.expectedValue}", got "${output}"`);
        }
    }

    return {
        passed: failures.length === 0,
        failures,
    };
}
