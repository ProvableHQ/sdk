/**
 * Verify that Aleo addresses in generated code are well-formed.
 * Usage: npx ts-node verify-address.ts <file-to-check>
 */

import { readFileSync } from "fs";

const ALEO_ADDRESS_REGEX = /aleo1[a-z0-9]{58}/g;
const ALEO_ADDRESS_LENGTH = 63;

function verifyAddresses(filePath: string): { valid: boolean; errors: string[] } {
    const content = readFileSync(filePath, "utf-8");
    const errors: string[] = [];

    // Find all address-like strings
    const matches = content.match(ALEO_ADDRESS_REGEX) || [];

    for (const match of matches) {
        if (match.length !== ALEO_ADDRESS_LENGTH) {
            errors.push(`Invalid address length: "${match}" (${match.length} chars, expected ${ALEO_ADDRESS_LENGTH})`);
        }
    }

    // Check for placeholder addresses that should be replaced
    const placeholders = content.match(/aleo1(recipient|sender|example|test|placeholder)\.\.\./g) || [];
    if (placeholders.length > 0) {
        errors.push(`Found placeholder addresses that need replacement: ${placeholders.join(", ")}`);
    }

    return { valid: errors.length === 0, errors };
}

const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: npx ts-node verify-address.ts <file>");
    process.exit(1);
}

const result = verifyAddresses(filePath);
if (result.valid) {
    console.log("All addresses are well-formed.");
} else {
    console.error("Address validation errors:");
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
}
