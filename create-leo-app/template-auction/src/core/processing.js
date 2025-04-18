import { json } from "@codemirror/legacy-modes/mode/javascript";

export function removeVisbilityModifiers(obj) {
    if (typeof obj === 'string') {
        return obj.replace(".private", "").replace(".public", "");
    } else if (Array.isArray(obj)) {
        return obj.map(item => removeVisbilityModifiers(item));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = removeVisbilityModifiers(obj[key]);
        }
        return newObj;
    } else {
        return obj; // numbers, booleans, null, undefined, functions, etc.
    }
}

export function parseAleoStyle(input) {
    // Step 1: Quote all keys (e.g. `starting_bid:` -> `"starting_bid":`)
    let jsonLike = input.replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // Step 2: Quote all string values with suffixes like `u64` or `field`
    jsonLike = jsonLike.replace(/([0-9]+)(u64|field|group|scalar|u128|u8|u32|u16|i8|i16|i32|i64|i128")/g, '"$1$2"');

    // Step 3: Ensure nested keys are properly quoted too (if any are missed)
    jsonLike = jsonLike.replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // Optional: You could parse and transform values like "25000u64" into numbers if needed
    console.log(jsonLike);
    return JSON.parse(jsonLike);
}
