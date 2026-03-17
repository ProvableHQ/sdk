/**
 * Verify that program execution code follows SDK best practices.
 * Usage: npx ts-node verify-execution.ts <file-to-check>
 */

import { readFileSync } from "fs";

function verifyExecution(filePath: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const content = readFileSync(filePath, "utf-8");
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for network-specific imports
    if (content.includes("from \"@provablehq/sdk\"") && !content.includes("from \"@provablehq/sdk/")) {
        errors.push("Must use network-specific import (e.g., @provablehq/sdk/testnet.js)");
    }

    // Check for hardcoded private keys
    if (content.match(/APrivateKey1[a-z0-9]{58}/)) {
        errors.push("SECURITY: Hardcoded private key detected. Use environment variables instead.");
    }

    // Check that program names end with .aleo
    const programNames = content.match(/programName:\s*["']([^"']+)["']/g) || [];
    for (const match of programNames) {
        const name = match.match(/["']([^"']+)["']/)?.[1];
        if (name && !name.endsWith(".aleo")) {
            errors.push(`Program name "${name}" must end with .aleo`);
        }
    }

    // Check for DPS without unnecessary initThreadPool
    if (content.includes("buildAuthorization") && content.includes("initThreadPool")) {
        warnings.push("initThreadPool() found alongside DPS (buildAuthorization). Thread pool is not needed for delegated proving.");
    }

    // Check for key provider setup when doing local proving
    if (content.includes("buildExecutionTransaction") && !content.includes("KeyProvider") && !content.includes("keyProvider")) {
        warnings.push("buildExecutionTransaction used without a KeyProvider. Consider setting up AleoKeyProvider for key caching.");
    }

    // Check for account cleanup
    if (content.includes("new Account(") && !content.includes("destroy()") && !content.includes("using ")) {
        warnings.push("Account created but no destroy() or `using` cleanup found.");
    }

    // Check for transaction confirmation
    if (content.includes("submitTransaction") && !content.includes("getTransaction")) {
        warnings.push("Transaction submitted but no confirmation polling found.");
    }

    return { valid: errors.length === 0, errors, warnings };
}

const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: npx ts-node verify-execution.ts <file>");
    process.exit(1);
}

const result = verifyExecution(filePath);

if (result.warnings.length > 0) {
    console.warn("Warnings:");
    result.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
}

if (result.valid) {
    console.log("Execution code passes validation.");
} else {
    console.error("Validation errors:");
    result.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
}
