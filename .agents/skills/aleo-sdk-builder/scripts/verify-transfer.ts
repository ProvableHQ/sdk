/**
 * Verify that transfer code follows SDK best practices.
 * Usage: npx ts-node verify-transfer.ts <file-to-check>
 */

import { readFileSync } from "fs";

const VALID_TRANSFER_TYPES = [
    "transfer_public",
    "transfer_private",
    "transfer_public_to_private",
    "transfer_private_to_public",
    "public",
    "private",
    "publicToPrivate",
    "privateToPublic",
];

function verifyTransfer(filePath: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const content = readFileSync(filePath, "utf-8");
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for network-specific imports
    if (content.includes("from \"@provablehq/sdk\"") && !content.includes("from \"@provablehq/sdk/")) {
        errors.push("Must use network-specific import (e.g., @provablehq/sdk/testnet.js), not bare @provablehq/sdk");
    }

    // Check for hardcoded fee amounts (bad practice)
    const hardcodedFees = content.match(/priorityFee:\s*[1-9]\d*(\.\d+)?(?!.*estimate)/g);
    if (hardcodedFees) {
        warnings.push("Found potentially hardcoded fee values. Consider using estimateExecutionFee() or estimateDeploymentFee()");
    }

    // Check for hardcoded private keys
    if (content.match(/APrivateKey1[a-z0-9]{58}/)) {
        errors.push("SECURITY: Hardcoded private key detected. Use environment variables instead.");
    }

    // Verify transfer type is valid if specified
    const transferTypeMatches = content.match(/(?:functionName|transferType):\s*["']([^"']+)["']/g) || [];
    for (const match of transferTypeMatches) {
        const typeValue = match.match(/["']([^"']+)["']/)?.[1];
        if (typeValue && typeValue.includes("transfer") && !VALID_TRANSFER_TYPES.includes(typeValue)) {
            errors.push(`Invalid transfer type: "${typeValue}". Valid types: ${VALID_TRANSFER_TYPES.join(", ")}`);
        }
    }

    // Check for account cleanup
    if (content.includes("new Account(") && !content.includes("destroy()") && !content.includes("using ")) {
        warnings.push("Account created but no destroy() or `using` cleanup found. Consider adding cleanup to prevent key leaks.");
    }

    // Check for transaction confirmation
    if (content.includes("submitTransaction") && !content.includes("getTransaction")) {
        warnings.push("Transaction submitted but no confirmation polling found. Always verify transactions are confirmed.");
    }

    return { valid: errors.length === 0, errors, warnings };
}

const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: npx ts-node verify-transfer.ts <file>");
    process.exit(1);
}

const result = verifyTransfer(filePath);

if (result.warnings.length > 0) {
    console.warn("Warnings:");
    result.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
}

if (result.valid) {
    console.log("Transfer code passes validation.");
} else {
    console.error("Validation errors:");
    result.errors.forEach(e => console.error(`  ✗ ${e}`));
    process.exit(1);
}
